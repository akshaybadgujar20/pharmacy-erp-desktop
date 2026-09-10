import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { PurchaseDocumentListQueryDto } from '../dto/purchase-document-list-query.dto';
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
import { StockMovementType } from '../../inventory/constants/inventory.constants';
import { PurchaseReturnStatus } from '../constants/purchase.constants';
import { CreatePurchaseReturnDto } from '../dto/create-purchase-return.dto';
import { PurchaseWorkflowDto } from '../dto/purchase-workflow.dto';
import { UpdatePurchaseReturnDto } from '../dto/update-purchase-return.dto';
import { assertBranchExists } from '../../configuration/utils/configuration.util';
import { toPurchaseReturnResponse } from '../mappers/purchase-return.mapper';
import {
  assertDraftStatus,
  assertReturnQuantityAvailable,
  assertSupplierActive,
  buildPurchaseDocumentListFilters,
  optimisticUpdate,
  throwNotFound,
} from '../utils/purchase.util';

@Injectable()
export class PurchaseReturnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
    private readonly sequences: SequenceGeneratorService,
    private readonly inventoryLedger: InventoryLedgerService,
  ) {}

  async list(query: PurchaseDocumentListQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.PurchaseReturnWhereInput = withBranchScope(scope, {
      deletedAt: null,
      ...buildPurchaseDocumentListFilters(query, 'returnDate'),
      ...(search
        ? {
            OR: [
              { purchaseReturnNumber: { contains: search } },
              { returnReason: { contains: search } },
            ],
          }
        : {}),
    });

    const [total, rows] = await Promise.all([
      this.prisma.client.purchaseReturn.count({ where }),
      this.prisma.client.purchaseReturn.findMany({
        where,
        orderBy: { returnDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPurchaseReturnResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const purchaseReturn = await this.prisma.client.purchaseReturn.findFirst({
      where: withBranchScope(scope, { id, deletedAt: null }),
    });

    if (!purchaseReturn) {
      throwNotFound(
        ErrorCode.PURCHASE_RETURN_NOT_FOUND,
        `Purchase return not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toPurchaseReturnResponse(purchaseReturn);
  }

  async create(dto: CreatePurchaseReturnDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const branch = await assertBranchExists(tx, dto.branchId);

      if (dto.branchId !== scope.branchId) {
        throw new ApplicationException(
          ErrorCode.FORBIDDEN,
          'Purchase return branch must match request context branch',
          HttpStatus.FORBIDDEN,
          { branchId: dto.branchId.toString() },
        );
      }

      await assertSupplierActive(tx, dto.supplierId);

      const { documentNumber } = await this.sequences.next(tx, {
        companyId: branch.companyId,
        branchId: branch.id,
        documentType: DocumentType.PURCHASE_RETURN,
        branchCode: branch.branchCode,
      });

      const now = BigInt(Date.now());
      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          uuid: randomUUID(),
          purchaseReturnNumber: documentNumber,
          supplierId: dto.supplierId,
          purchaseInvoiceId: dto.purchaseInvoiceId,
          branchId: dto.branchId,
          returnDate: dto.returnDate,
          returnType: dto.returnType,
          status: PurchaseReturnStatus.DRAFT,
          returnReason: dto.returnReason,
          grossAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          netAmount: 0,
          remarks: dto.remarks,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        purchaseReturn,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );

      return toPurchaseReturnResponse(purchaseReturn);
    });
  }

  async update(id: bigint, dto: UpdatePurchaseReturnDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.purchaseReturn.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PURCHASE_RETURN_NOT_FOUND,
          `Purchase return not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(
        existing.status,
        'Purchase return',
        PurchaseReturnStatus.DRAFT,
      );

      if (dto.supplierId) {
        await assertSupplierActive(tx, dto.supplierId);
      }

      const updateResult = await tx.purchaseReturn.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          supplierId: dto.supplierId,
          purchaseInvoiceId: dto.purchaseInvoiceId,
          returnDate: dto.returnDate,
          returnType: dto.returnType,
          returnReason: dto.returnReason,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase return version conflict or not found: ${id}`,
      );

      const purchaseReturn = await tx.purchaseReturn.findFirstOrThrow({
        where: { id },
      });

      await this.emitChange(
        tx,
        purchaseReturn,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );

      return toPurchaseReturnResponse(purchaseReturn);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.purchaseReturn.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PURCHASE_RETURN_NOT_FOUND,
          `Purchase return not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(
        existing.status,
        'Purchase return',
        PurchaseReturnStatus.DRAFT,
      );

      const updateResult = await tx.purchaseReturn.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase return version conflict or not found: ${id}`,
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

  async submit(id: bigint, dto: PurchaseWorkflowDto) {
    return this.transition(id, dto, {
      from: [PurchaseReturnStatus.DRAFT],
      to: PurchaseReturnStatus.PENDING_APPROVAL,
      requireItems: true,
    });
  }

  async approve(id: bigint, dto: PurchaseWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const purchaseReturn = await tx.purchaseReturn.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
        include: { items: { where: { deletedAt: null } } },
      });

      if (!purchaseReturn) {
        throwNotFound(
          ErrorCode.PURCHASE_RETURN_NOT_FOUND,
          `Purchase return not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (purchaseReturn.status !== PurchaseReturnStatus.PENDING_APPROVAL) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only pending purchase returns can be approved',
          HttpStatus.CONFLICT,
          { status: purchaseReturn.status },
        );
      }

      if (purchaseReturn.items.length === 0) {
        throw new ApplicationException(
          ErrorCode.DOCUMENT_HAS_NO_ITEMS,
          'Purchase return must have at least one item',
          HttpStatus.BAD_REQUEST,
          { id: id.toString() },
        );
      }

      const branch = await assertBranchExists(tx, purchaseReturn.branchId);
      const userId = this.requestContext.tryGet()?.userId;
      let grossAmount = new Prisma.Decimal(0);
      let discountAmount = new Prisma.Decimal(0);
      let taxAmount = new Prisma.Decimal(0);

      for (const item of purchaseReturn.items) {
        await assertReturnQuantityAvailable(
          tx,
          purchaseReturn.branchId,
          item.batchId,
          item.returnQuantity,
        );

        await this.inventoryLedger.applyMovement(tx, {
          branchId: purchaseReturn.branchId,
          branchCode: branch.branchCode,
          companyId: branch.companyId,
          medicineId: item.medicineId,
          batchId: item.batchId,
          direction: 'OUT',
          quantity: item.returnQuantity,
          unitCost: item.unitPrice,
          movementType: StockMovementType.PURCHASE_RETURN,
          referenceTable: 'purchase_returns',
          referenceId: purchaseReturn.id,
          createdBy: userId,
          remarks: dto.remarks ?? item.remarks ?? undefined,
        });

        grossAmount = grossAmount.add(
          new Prisma.Decimal(item.returnQuantity).mul(item.unitPrice),
        );
        discountAmount = discountAmount.add(item.discountAmount);
        taxAmount = taxAmount.add(item.taxAmount);
      }

      const netAmount = grossAmount.sub(discountAmount).add(taxAmount);
      const now = BigInt(Date.now());

      const updateResult = await tx.purchaseReturn.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: PurchaseReturnStatus.DISPATCHED_TO_SUPPLIER,
          grossAmount,
          discountAmount,
          taxAmount,
          netAmount,
          approvedByEmployeeId: userId,
          approvedAt: now,
          updatedAt: now,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase return version conflict or not found: ${id}`,
      );

      const updated = await tx.purchaseReturn.findFirstOrThrow({
        where: { id },
      });
      await this.emitChange(
        tx,
        updated,
        AuditAction.APPROVE,
        OutboxOperation.UPDATE,
      );

      return toPurchaseReturnResponse(updated);
    });
  }

  async reject(id: bigint, dto: PurchaseWorkflowDto) {
    return this.transition(id, dto, {
      from: [PurchaseReturnStatus.PENDING_APPROVAL],
      to: PurchaseReturnStatus.DRAFT,
      action: AuditAction.REJECT,
    });
  }

  async cancel(id: bigint, dto: PurchaseWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const purchaseReturn = await tx.purchaseReturn.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
        include: { items: { where: { deletedAt: null } } },
      });

      if (!purchaseReturn) {
        throwNotFound(
          ErrorCode.PURCHASE_RETURN_NOT_FOUND,
          `Purchase return not found: ${id}`,
          { id: id.toString() },
        );
      }

      const cancellable: string[] = [
        PurchaseReturnStatus.DRAFT,
        PurchaseReturnStatus.PENDING_APPROVAL,
        PurchaseReturnStatus.DISPATCHED_TO_SUPPLIER,
      ];

      if (!cancellable.includes(purchaseReturn.status)) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          `Purchase return cannot be cancelled from status ${purchaseReturn.status}`,
          HttpStatus.CONFLICT,
          { status: purchaseReturn.status },
        );
      }

      if (
        purchaseReturn.status === PurchaseReturnStatus.DISPATCHED_TO_SUPPLIER
      ) {
        const branch = await assertBranchExists(tx, purchaseReturn.branchId);
        const userId = this.requestContext.tryGet()?.userId;

        for (const item of purchaseReturn.items) {
          await this.inventoryLedger.applyMovement(tx, {
            branchId: purchaseReturn.branchId,
            branchCode: branch.branchCode,
            companyId: branch.companyId,
            medicineId: item.medicineId,
            batchId: item.batchId,
            direction: 'IN',
            quantity: item.returnQuantity,
            unitCost: item.unitPrice,
            movementType: StockMovementType.PURCHASE_RETURN,
            referenceTable: 'purchase_returns',
            referenceId: purchaseReturn.id,
            createdBy: userId,
            remarks: dto.remarks ?? 'Purchase return cancellation reversal',
          });
        }
      }

      const updateResult = await tx.purchaseReturn.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: PurchaseReturnStatus.CANCELLED,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase return version conflict or not found: ${id}`,
      );

      const updated = await tx.purchaseReturn.findFirstOrThrow({
        where: { id },
      });
      await this.emitChange(
        tx,
        updated,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );

      return toPurchaseReturnResponse(updated);
    });
  }

  private async transition(
    id: bigint,
    dto: PurchaseWorkflowDto,
    options: {
      from: string[];
      to: string;
      requireItems?: boolean;
      action?: (typeof AuditAction)[keyof typeof AuditAction];
    },
  ) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const purchaseReturn = await tx.purchaseReturn.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
        include: { items: { where: { deletedAt: null }, take: 1 } },
      });

      if (!purchaseReturn) {
        throwNotFound(
          ErrorCode.PURCHASE_RETURN_NOT_FOUND,
          `Purchase return not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (!options.from.includes(purchaseReturn.status)) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          `Purchase return cannot transition from ${purchaseReturn.status} to ${options.to}`,
          HttpStatus.CONFLICT,
          { status: purchaseReturn.status, targetStatus: options.to },
        );
      }

      if (options.requireItems && purchaseReturn.items.length === 0) {
        throw new ApplicationException(
          ErrorCode.DOCUMENT_HAS_NO_ITEMS,
          'Purchase return must have at least one item',
          HttpStatus.BAD_REQUEST,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.purchaseReturn.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: options.to,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase return version conflict or not found: ${id}`,
      );

      const updated = await tx.purchaseReturn.findFirstOrThrow({
        where: { id },
      });
      await this.emitChange(
        tx,
        updated,
        options.action ?? AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );

      return toPurchaseReturnResponse(updated);
    });
  }

  private async emitChange(
    tx: Prisma.TransactionClient,
    purchaseReturn: { id: bigint; uuid: string; status?: string },
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.PURCHASE_RETURN,
      entityId: purchaseReturn.id,
      entityUuid: purchaseReturn.uuid,
      action,
      module: AuditModule.PURCHASE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.PURCHASE_RETURN,
      entityUuid: purchaseReturn.uuid,
      operation,
      payload: { uuid: purchaseReturn.uuid, status: purchaseReturn.status },
    });
  }
}
