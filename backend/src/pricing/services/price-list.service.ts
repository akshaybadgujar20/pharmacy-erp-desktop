import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { PriceList } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { auditAndLogChanges } from '../../audit/utils/audit.util';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { getTenantScope } from '../../persistence/context/tenant-scope.util';
import { buildCompanyBranchFilter } from '../../persistence/context/branch-scope.util';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { CreatePriceListDto } from '../dto/create-price-list.dto';
import { PriceListListQueryDto } from '../dto/price-list-list-query.dto';
import { UpdatePriceListDto } from '../dto/update-price-list.dto';
import { toPriceListResponse } from '../mappers/price-list.mapper';
import {
  assertPriceListNotInUse,
  buildPriceListListWhere,
  clearOtherDefaults,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/pricing.util';

const PRICE_LIST_AUDIT_FIELDS = [
  { name: 'priceListCode' },
  { name: 'priceListName' },
  { name: 'branchId', dataType: 'bigint' },
  { name: 'priceListType' },
  { name: 'effectiveFrom', dataType: 'bigint' },
  { name: 'effectiveTo', dataType: 'bigint' },
  { name: 'isDefault', dataType: 'boolean' },
  { name: 'isActive', dataType: 'boolean' },
  { name: 'remarks' },
];

@Injectable()
export class PriceListService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: PriceListListQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where = buildPriceListListWhere(scope.branchId, query);

    const [total, rows] = await Promise.all([
      this.prisma.client.priceList.count({ where }),
      this.prisma.client.priceList.findMany({
        where,
        orderBy: { priceListCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPriceListResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const priceList = await this.prisma.client.priceList.findFirst({
      where: {
        id,
        deletedAt: null,
        ...buildCompanyBranchFilter(scope.branchId),
      },
    });

    if (!priceList) {
      throwNotFound(
        ErrorCode.PRICE_LIST_NOT_FOUND,
        `Price list not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toPriceListResponse(priceList);
  }

  async create(dto: CreatePriceListDto) {
    const scope = getTenantScope(this.requestContext);
    this.validateBranchId(dto.branchId, scope.branchId);

    return this.unitOfWork.run(async (tx) => {
      await this.assertUniqueFields(tx, dto.priceListCode, dto.priceListName);

      const branchId = dto.branchId ?? null;
      if (dto.isDefault) {
        await clearOtherDefaults(tx, branchId);
      }

      const now = BigInt(Date.now());
      const priceList = await tx.priceList.create({
        data: {
          uuid: randomUUID(),
          priceListCode: dto.priceListCode,
          priceListName: dto.priceListName,
          branchId,
          priceListType: dto.priceListType,
          effectiveFrom: dto.effectiveFrom,
          effectiveTo: dto.effectiveTo ?? null,
          isDefault: dto.isDefault ?? false,
          isActive: dto.isActive ?? true,
          remarks: dto.remarks ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        priceList,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toPriceListResponse(priceList);
    });
  }

  async update(id: bigint, dto: UpdatePriceListDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.priceList.findFirst({
        where: {
          id,
          deletedAt: null,
          ...buildCompanyBranchFilter(scope.branchId),
        },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PRICE_LIST_NOT_FOUND,
          `Price list not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (dto.branchId !== undefined) {
        this.validateBranchId(dto.branchId, scope.branchId);
      }

      if (dto.priceListCode && dto.priceListCode !== existing.priceListCode) {
        await this.assertUniqueFields(tx, dto.priceListCode, undefined, id);
      }

      if (dto.priceListName && dto.priceListName !== existing.priceListName) {
        await this.assertUniqueFields(tx, undefined, dto.priceListName, id);
      }

      const branchId =
        dto.branchId !== undefined ? (dto.branchId ?? null) : existing.branchId;
      if (dto.isDefault) {
        await clearOtherDefaults(tx, branchId, id);
      }

      const updateResult = await tx.priceList.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          priceListCode: dto.priceListCode,
          priceListName: dto.priceListName,
          branchId:
            dto.branchId !== undefined ? (dto.branchId ?? null) : undefined,
          priceListType: dto.priceListType,
          effectiveFrom: dto.effectiveFrom,
          effectiveTo: dto.effectiveTo,
          isDefault: dto.isDefault,
          isActive: dto.isActive,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Price list version conflict or not found: ${id}`,
      );

      const priceList = await tx.priceList.findFirstOrThrow({ where: { id } });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.PRICE_LIST,
          entityId: priceList.id,
          entityUuid: priceList.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.PRICING,
        },
        existing as unknown as Record<string, unknown>,
        priceList as unknown as Record<string, unknown>,
        PRICE_LIST_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PRICE_LIST,
        entityUuid: priceList.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: priceList.uuid,
          priceListCode: priceList.priceListCode,
        },
      });
      return toPriceListResponse(priceList);
    });
  }

  async delete(id: bigint, version: bigint) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.priceList.findFirst({
        where: {
          id,
          deletedAt: null,
          ...buildCompanyBranchFilter(scope.branchId),
        },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PRICE_LIST_NOT_FOUND,
          `Price list not found: ${id}`,
          { id: id.toString() },
        );
      }

      await assertPriceListNotInUse(tx, id);

      const updateResult = await tx.priceList.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Price list version conflict or not found: ${id}`,
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

  private validateBranchId(
    branchId: bigint | undefined | null,
    jwtBranchId: bigint,
  ): void {
    if (branchId != null && branchId !== jwtBranchId) {
      throw new ApplicationException(
        ErrorCode.FORBIDDEN,
        'Price list branch must match JWT branch or be org-wide',
        HttpStatus.FORBIDDEN,
        { branchId: branchId.toString() },
      );
    }
  }

  private async assertUniqueFields(
    tx: TxClient,
    priceListCode?: string,
    priceListName?: string,
    excludeId?: bigint,
  ): Promise<void> {
    if (priceListCode) {
      const existing = await tx.priceList.findFirst({
        where: {
          priceListCode,
          deletedAt: null,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      });

      if (existing) {
        throwConflict(
          ErrorCode.CONFLICT,
          `Price list code already exists: ${priceListCode}`,
          { priceListCode },
        );
      }
    }

    if (priceListName) {
      const existing = await tx.priceList.findFirst({
        where: {
          priceListName,
          deletedAt: null,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      });

      if (existing) {
        throwConflict(
          ErrorCode.CONFLICT,
          `Price list name already exists: ${priceListName}`,
          { priceListName },
        );
      }
    }
  }

  private async emitChange(
    tx: TxClient,
    priceList: PriceList,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.PRICE_LIST,
      entityId: priceList.id,
      entityUuid: priceList.uuid,
      action,
      module: AuditModule.PRICING,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.PRICE_LIST,
      entityUuid: priceList.uuid,
      operation,
      payload: {
        uuid: priceList.uuid,
        priceListCode: priceList.priceListCode,
      },
    });
  }
}
