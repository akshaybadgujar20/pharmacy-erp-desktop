import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import {
  getTenantScope,
  withBranchScope,
} from '../../persistence/context/tenant-scope.util';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { InventoryLedgerService } from '../../persistence/inventory/inventory-ledger.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { DocumentType } from '../../persistence/sequence/document-type.constants';
import { SequenceGeneratorService } from '../../persistence/sequence/sequence-generator.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { ApproveStockAdjustmentDto } from '../dto/approve-stock-adjustment.dto';
import { CreateStockAdjustmentDto } from '../dto/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from '../dto/update-stock-adjustment.dto';
import { toStockAdjustmentResponse } from '../mappers/stock-adjustment.mapper';
import {
  StockAdjustmentStatus,
  StockMovementType,
} from '../constants/inventory.constants';
import {
  assertBranchExists,
  assertDraftStatus,
  optimisticUpdate,
  throwNotFound,
} from '../utils/inventory.util';

@Injectable()
export class StockAdjustmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
    private readonly inventoryLedger: InventoryLedgerService,
    private readonly sequences: SequenceGeneratorService,
  ) {}

  async list(query: PaginationQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.StockAdjustmentWhereInput = withBranchScope(scope, {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { adjustmentNumber: { contains: search } },
              { reason: { contains: search } },
            ],
          }
        : {}),
    });

    const [total, rows] = await Promise.all([
      this.prisma.client.stockAdjustment.count({ where }),
      this.prisma.client.stockAdjustment.findMany({
        where,
        orderBy: { adjustmentDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toStockAdjustmentResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const adjustment = await this.prisma.client.stockAdjustment.findFirst({
      where: withBranchScope(scope, { id, deletedAt: null }),
    });

    if (!adjustment) {
      throwNotFound(
        ErrorCode.STOCK_ADJUSTMENT_NOT_FOUND,
        `Stock adjustment not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toStockAdjustmentResponse(adjustment);
  }

  async create(dto: CreateStockAdjustmentDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const branch = await assertBranchExists(tx, dto.branchId);

      if (dto.branchId !== scope.branchId) {
        throw new ApplicationException(
          ErrorCode.FORBIDDEN,
          'Adjustment branch must match request context branch',
          HttpStatus.FORBIDDEN,
          { branchId: dto.branchId.toString() },
        );
      }

      const { documentNumber } = await this.sequences.next(tx, {
        companyId: branch.companyId,
        branchId: branch.id,
        documentType: DocumentType.STOCK_ADJUSTMENT,
        branchCode: branch.branchCode,
      });

      const now = BigInt(Date.now());
      const adjustment = await tx.stockAdjustment.create({
        data: {
          uuid: randomUUID(),
          adjustmentNumber: documentNumber,
          branchId: dto.branchId,
          adjustmentType: dto.adjustmentType,
          adjustmentDate: dto.adjustmentDate,
          reason: dto.reason,
          status: StockAdjustmentStatus.DRAFT,
          isActive: dto.isActive ?? true,
          createdBy: this.requestContext.tryGet()?.userId,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_ADJUSTMENT,
        entityId: adjustment.id,
        entityUuid: adjustment.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_ADJUSTMENT,
        entityUuid: adjustment.uuid,
        operation: OutboxOperation.CREATE,
        payload: {
          uuid: adjustment.uuid,
          adjustmentNumber: adjustment.adjustmentNumber,
        },
      });

      return toStockAdjustmentResponse(adjustment);
    });
  }

  async update(id: bigint, dto: UpdateStockAdjustmentDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.stockAdjustment.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.STOCK_ADJUSTMENT_NOT_FOUND,
          `Stock adjustment not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(existing.status, 'Stock adjustment');

      const updateResult = await tx.stockAdjustment.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          adjustmentType: dto.adjustmentType,
          adjustmentDate: dto.adjustmentDate,
          reason: dto.reason,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Stock adjustment version conflict or not found: ${id}`,
      );

      const adjustment = await tx.stockAdjustment.findFirstOrThrow({
        where: { id },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_ADJUSTMENT,
        entityId: adjustment.id,
        entityUuid: adjustment.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_ADJUSTMENT,
        entityUuid: adjustment.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: adjustment.uuid,
          adjustmentNumber: adjustment.adjustmentNumber,
        },
      });

      return toStockAdjustmentResponse(adjustment);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.stockAdjustment.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.STOCK_ADJUSTMENT_NOT_FOUND,
          `Stock adjustment not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(existing.status, 'Stock adjustment');

      const updateResult = await tx.stockAdjustment.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Stock adjustment version conflict or not found: ${id}`,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_ADJUSTMENT,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_ADJUSTMENT,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }

  async approve(id: bigint, dto: ApproveStockAdjustmentDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const adjustment = await tx.stockAdjustment.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
        include: {
          items: {
            where: { deletedAt: null },
            include: { batch: { select: { medicineId: true } } },
          },
        },
      });

      if (!adjustment) {
        throwNotFound(
          ErrorCode.STOCK_ADJUSTMENT_NOT_FOUND,
          `Stock adjustment not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (adjustment.status !== StockAdjustmentStatus.DRAFT) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only DRAFT adjustments can be approved',
          HttpStatus.CONFLICT,
          { status: adjustment.status },
        );
      }

      if (adjustment.items.length === 0) {
        throw new ApplicationException(
          ErrorCode.DOCUMENT_HAS_NO_ITEMS,
          'Stock adjustment must have at least one item',
          HttpStatus.BAD_REQUEST,
          { id: id.toString() },
        );
      }

      const branch = await assertBranchExists(tx, adjustment.branchId);
      const userId = this.requestContext.tryGet()?.userId;

      for (const item of adjustment.items) {
        const qty = new Prisma.Decimal(item.quantity);
        if (qty.eq(0)) {
          continue;
        }

        const isGain = qty.gt(0);
        await this.inventoryLedger.applyMovement(tx, {
          branchId: adjustment.branchId,
          branchCode: branch.branchCode,
          companyId: branch.companyId,
          medicineId: item.batch.medicineId,
          batchId: item.batchId,
          direction: isGain ? 'IN' : 'OUT',
          quantity: isGain ? qty : qty.abs(),
          unitCost: item.unitCost,
          movementType: isGain
            ? StockMovementType.ADJUSTMENT_GAIN
            : StockMovementType.ADJUSTMENT_LOSS,
          referenceTable: 'stock_adjustments',
          referenceId: adjustment.id,
          createdBy: userId,
          remarks: dto.remarks ?? item.remarks ?? undefined,
        });
      }

      const now = BigInt(Date.now());
      const updated = await tx.stockAdjustment.update({
        where: { id },
        data: {
          status: StockAdjustmentStatus.APPROVED,
          approvedAt: now,
          updatedAt: now,
          version: { increment: 1 },
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_ADJUSTMENT,
        entityId: updated.id,
        entityUuid: updated.uuid,
        action: AuditAction.APPROVE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_ADJUSTMENT,
        entityUuid: updated.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: updated.uuid,
          adjustmentNumber: updated.adjustmentNumber,
          status: updated.status,
        },
      });

      return toStockAdjustmentResponse(updated);
    });
  }
}
