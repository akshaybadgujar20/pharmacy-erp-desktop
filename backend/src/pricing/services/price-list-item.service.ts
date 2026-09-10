import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PriceListItem, Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { ErrorCode } from '../../common/exceptions/error-code';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { getTenantScope } from '../../persistence/context/tenant-scope.util';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import {
  CreatePriceListItemDto,
  UpdatePriceListItemDto,
} from '../dto/create-price-list-item.dto';
import { ReplacePriceListItemsDto } from '../dto/replace-price-list-items.dto';
import { toPriceListItemResponse } from '../mappers/price-list-item.mapper';
import {
  assertMedicineExists,
  assertPriceListExists,
  assertTaxExists,
  hardDeleteAllPriceListItems,
  hardDeletePriceListItemSlot,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/pricing.util';

@Injectable()
export class PriceListItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(priceListId: bigint, query: PaginationQueryDto) {
    const scope = getTenantScope(this.requestContext);
    await this.ensurePriceListExists(priceListId, scope.branchId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.PriceListItemWhereInput = {
      priceListId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.priceListItem.count({ where }),
      this.prisma.client.priceListItem.findMany({
        where,
        orderBy: { medicineId: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPriceListItemResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(priceListId: bigint, id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const item = await this.findActive(priceListId, id, scope.branchId);
    return toPriceListItemResponse(item);
  }

  async create(priceListId: bigint, dto: CreatePriceListItemDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      await assertPriceListExists(tx, priceListId, scope.branchId, false);
      await assertMedicineExists(tx, dto.medicineId);
      if (dto.taxId) {
        await assertTaxExists(tx, dto.taxId);
      }

      await hardDeletePriceListItemSlot(tx, priceListId, dto.medicineId);

      const existing = await tx.priceListItem.findFirst({
        where: { priceListId, medicineId: dto.medicineId, deletedAt: null },
      });

      if (existing) {
        throwConflict(
          ErrorCode.CONFLICT,
          `Price list item already exists for medicine: ${dto.medicineId}`,
          {
            priceListId: priceListId.toString(),
            medicineId: dto.medicineId.toString(),
          },
        );
      }

      const now = BigInt(Date.now());
      const item = await tx.priceListItem.create({
        data: {
          uuid: randomUUID(),
          priceListId,
          medicineId: dto.medicineId,
          sellingPrice: dto.sellingPrice,
          mrp: dto.mrp,
          minimumSellingPrice: dto.minimumSellingPrice ?? null,
          discountPercent: dto.discountPercent ?? null,
          taxId: dto.taxId ?? null,
          effectiveFrom: dto.effectiveFrom,
          effectiveTo: dto.effectiveTo ?? null,
          isActive: dto.isActive ?? true,
          remarks: dto.remarks ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        item,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toPriceListItemResponse(item);
    });
  }

  async update(priceListId: bigint, id: bigint, dto: UpdatePriceListItemDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.priceListItem.findFirst({
        where: { id, priceListId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PRICE_LIST_ITEM_NOT_FOUND,
          `Price list item not found: ${id}`,
          { id: id.toString() },
        );
      }

      await assertPriceListExists(tx, priceListId, scope.branchId, false);

      const medicineId = dto.medicineId ?? existing.medicineId;
      if (dto.medicineId) {
        await assertMedicineExists(tx, dto.medicineId);
        if (dto.medicineId !== existing.medicineId) {
          await hardDeletePriceListItemSlot(tx, priceListId, dto.medicineId);
          const duplicate = await tx.priceListItem.findFirst({
            where: {
              priceListId,
              medicineId: dto.medicineId,
              deletedAt: null,
              NOT: { id },
            },
          });
          if (duplicate) {
            throwConflict(
              ErrorCode.CONFLICT,
              `Price list item already exists for medicine: ${dto.medicineId}`,
              { medicineId: dto.medicineId.toString() },
            );
          }
        }
      }

      if (dto.taxId) {
        await assertTaxExists(tx, dto.taxId);
      }

      const updateResult = await tx.priceListItem.updateMany({
        where: { id, priceListId, version: dto.version, deletedAt: null },
        data: {
          medicineId,
          sellingPrice: dto.sellingPrice,
          mrp: dto.mrp,
          minimumSellingPrice: dto.minimumSellingPrice,
          discountPercent: dto.discountPercent,
          taxId: dto.taxId,
          effectiveFrom: dto.effectiveFrom,
          effectiveTo: dto.effectiveTo,
          isActive: dto.isActive,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Price list item version conflict or not found: ${id}`,
      );

      const item = await tx.priceListItem.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        item,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toPriceListItemResponse(item);
    });
  }

  async delete(priceListId: bigint, id: bigint, version: number) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.priceListItem.findFirst({
        where: { id, priceListId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PRICE_LIST_ITEM_NOT_FOUND,
          `Price list item not found: ${id}`,
          { id: id.toString() },
        );
      }

      await assertPriceListExists(tx, priceListId, scope.branchId, false);

      const updateResult = await tx.priceListItem.updateMany({
        where: { id, priceListId, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Price list item version conflict or not found: ${id}`,
      );
      await this.emitChange(
        tx,
        existing,
        AuditAction.DELETE,
        OutboxOperation.DELETE,
      );
      return { id: id.toString(), deleted: true };
    });
  }

  async replace(priceListId: bigint, dto: ReplacePriceListItemsDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      await assertPriceListExists(tx, priceListId, scope.branchId, false);

      const medicineIds = dto.items.map((item) => item.medicineId);
      const uniqueIds = new Set(medicineIds.map((id) => id.toString()));

      if (uniqueIds.size !== medicineIds.length) {
        throwConflict(
          ErrorCode.CONFLICT,
          'Duplicate medicine IDs in replace payload',
          { priceListId: priceListId.toString() },
        );
      }

      for (const item of dto.items) {
        await assertMedicineExists(tx, item.medicineId);
        if (item.taxId) {
          await assertTaxExists(tx, item.taxId);
        }
      }

      const existingRows = await hardDeleteAllPriceListItems(tx, priceListId);

      for (const row of existingRows) {
        await this.auditService.log(tx, {
          entityType: OutboxEntityType.PRICE_LIST_ITEM,
          entityId: row.id,
          entityUuid: row.uuid,
          action: AuditAction.DELETE,
          module: AuditModule.PRICING,
        });
        await this.outboxService.enqueue(tx, {
          entityType: OutboxEntityType.PRICE_LIST_ITEM,
          entityUuid: row.uuid,
          operation: OutboxOperation.DELETE,
          payload: {
            uuid: row.uuid,
            priceListId: priceListId.toString(),
          },
        });
      }

      const now = BigInt(Date.now());
      const results: PriceListItem[] = [];

      for (const item of dto.items) {
        const priceListItem = await tx.priceListItem.create({
          data: {
            uuid: randomUUID(),
            priceListId,
            medicineId: item.medicineId,
            sellingPrice: item.sellingPrice,
            mrp: item.mrp,
            minimumSellingPrice: item.minimumSellingPrice ?? null,
            discountPercent: item.discountPercent ?? null,
            taxId: item.taxId ?? null,
            effectiveFrom: item.effectiveFrom,
            effectiveTo: item.effectiveTo ?? null,
            isActive: item.isActive ?? true,
            remarks: item.remarks ?? null,
            createdAt: now,
            updatedAt: now,
          },
        });
        results.push(priceListItem);
      }

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PRICE_LIST_ITEM,
        entityId: priceListId,
        action: AuditAction.UPDATE,
        module: AuditModule.PRICING,
        description: `Replaced price list items for price list ${priceListId}`,
      });

      for (const priceListItem of results) {
        await this.outboxService.enqueue(tx, {
          entityType: OutboxEntityType.PRICE_LIST_ITEM,
          entityUuid: priceListItem.uuid,
          operation: OutboxOperation.CREATE,
          payload: {
            uuid: priceListItem.uuid,
            priceListId: priceListId.toString(),
          },
        });
      }

      return results.map(toPriceListItemResponse);
    });
  }

  private async ensurePriceListExists(priceListId: bigint, branchId: bigint) {
    const priceList = await this.prisma.client.priceList.findFirst({
      where: {
        id: priceListId,
        deletedAt: null,
        OR: [{ branchId }, { branchId: null }],
      },
      select: { id: true },
    });

    if (!priceList) {
      throwNotFound(
        ErrorCode.PRICE_LIST_NOT_FOUND,
        `Price list not found: ${priceListId}`,
        { id: priceListId.toString() },
      );
    }
  }

  private async findActive(priceListId: bigint, id: bigint, branchId: bigint) {
    await this.ensurePriceListExists(priceListId, branchId);

    const item = await this.prisma.client.priceListItem.findFirst({
      where: { id, priceListId, deletedAt: null },
    });

    if (!item) {
      throwNotFound(
        ErrorCode.PRICE_LIST_ITEM_NOT_FOUND,
        `Price list item not found: ${id}`,
        { id: id.toString() },
      );
    }

    return item;
  }

  private async emitChange(
    tx: TxClient,
    item: PriceListItem,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.PRICE_LIST_ITEM,
      entityId: item.id,
      entityUuid: item.uuid,
      action,
      module: AuditModule.PRICING,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.PRICE_LIST_ITEM,
      entityUuid: item.uuid,
      operation,
      payload: {
        uuid: item.uuid,
        priceListId: item.priceListId.toString(),
      },
    });
  }
}
