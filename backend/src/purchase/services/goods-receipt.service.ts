import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { GoodsReceiptListQueryDto } from '../dto/purchase-document-list-query.dto';
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
import { SettingKey } from '../../settings/setting-keys.constants';
import { SettingsService } from '../../settings/settings.service';
import { StockMovementType } from '../../inventory/constants/inventory.constants';
import { GoodsReceiptStatus } from '../constants/purchase.constants';
import { CreateGoodsReceiptDto } from '../dto/create-goods-receipt.dto';
import { PurchaseWorkflowDto } from '../dto/purchase-workflow.dto';
import { UpdateGoodsReceiptDto } from '../dto/update-goods-receipt.dto';
import { toGoodsReceiptResponse } from '../mappers/goods-receipt.mapper';
import {
  assertBranchExists,
  assertDraftStatus,
  assertEmployeeExists,
  assertSupplierActive,
  buildPurchaseDocumentListFilters,
  grnStockQuantity,
  isGrnStockPosted,
  optimisticUpdate,
  resolveOrCreateBatch,
  rollupPurchaseOrderStatus,
  throwNotFound,
  validateGrnPurchaseOrderLink,
} from '../utils/purchase.util';

@Injectable()
export class GoodsReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
    private readonly sequences: SequenceGeneratorService,
    private readonly inventoryLedger: InventoryLedgerService,
    private readonly settingsService: SettingsService,
  ) {}

  async list(query: GoodsReceiptListQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.GoodsReceiptWhereInput = withBranchScope(scope, {
      deletedAt: null,
      ...buildPurchaseDocumentListFilters(query, 'receiptDate'),
      ...(search
        ? {
            OR: [
              { goodsReceiptNumber: { contains: search } },
              { supplierChallanNo: { contains: search } },
              { supplierInvoiceNo: { contains: search } },
            ],
          }
        : {}),
    });

    const [total, rows] = await Promise.all([
      this.prisma.client.goodsReceipt.count({ where }),
      this.prisma.client.goodsReceipt.findMany({
        where,
        orderBy: { receiptDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toGoodsReceiptResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const receipt = await this.prisma.client.goodsReceipt.findFirst({
      where: withBranchScope(scope, { id, deletedAt: null }),
    });

    if (!receipt) {
      throwNotFound(
        ErrorCode.GOODS_RECEIPT_NOT_FOUND,
        `Goods receipt not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toGoodsReceiptResponse(receipt);
  }

  async create(dto: CreateGoodsReceiptDto) {
    if (!dto.purchaseOrderId) {
      const allowed = await this.settingsService.getBoolean(
        SettingKey.PURCHASE_ALLOW_GRN_WITHOUT_PO,
        false,
      );
      if (!allowed) {
        throw new ApplicationException(
          ErrorCode.GRN_PO_REQUIRED,
          'Purchase order is required for goods receipt',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const branch = await assertBranchExists(tx, dto.branchId);

      if (dto.branchId !== scope.branchId) {
        throw new ApplicationException(
          ErrorCode.FORBIDDEN,
          'Goods receipt branch must match request context branch',
          HttpStatus.FORBIDDEN,
          { branchId: dto.branchId.toString() },
        );
      }

      await assertSupplierActive(tx, dto.supplierId);
      await assertEmployeeExists(tx, dto.receivedByEmployeeId);

      await validateGrnPurchaseOrderLink(
        tx,
        scope,
        dto.supplierId,
        dto.purchaseOrderId,
      );

      const { documentNumber } = await this.sequences.next(tx, {
        companyId: branch.companyId,
        branchId: branch.id,
        documentType: DocumentType.GOODS_RECEIPT,
        branchCode: branch.branchCode,
      });

      const now = BigInt(Date.now());
      const receipt = await tx.goodsReceipt.create({
        data: {
          uuid: randomUUID(),
          goodsReceiptNumber: documentNumber,
          purchaseOrderId: dto.purchaseOrderId,
          supplierId: dto.supplierId,
          branchId: dto.branchId,
          receiptDate: dto.receiptDate,
          supplierChallanNo: dto.supplierChallanNo,
          supplierChallanDate: dto.supplierChallanDate,
          supplierInvoiceNo: dto.supplierInvoiceNo,
          supplierInvoiceDate: dto.supplierInvoiceDate,
          vehicleNumber: dto.vehicleNumber,
          isColdChainMaintained: dto.isColdChainMaintained ?? true,
          status: GoodsReceiptStatus.DRAFT,
          remarks: dto.remarks,
          receivedByEmployeeId: dto.receivedByEmployeeId,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.GOODS_RECEIPT,
        entityId: receipt.id,
        entityUuid: receipt.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.PURCHASE,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.GOODS_RECEIPT,
        entityUuid: receipt.uuid,
        operation: OutboxOperation.CREATE,
        payload: {
          uuid: receipt.uuid,
          goodsReceiptNumber: receipt.goodsReceiptNumber,
        },
      });

      return toGoodsReceiptResponse(receipt);
    });
  }

  async update(id: bigint, dto: UpdateGoodsReceiptDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.goodsReceipt.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.GOODS_RECEIPT_NOT_FOUND,
          `Goods receipt not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(
        existing.status,
        'Goods receipt',
        GoodsReceiptStatus.DRAFT,
      );

      if (dto.supplierId) {
        await assertSupplierActive(tx, dto.supplierId);
      }
      if (dto.receivedByEmployeeId) {
        await assertEmployeeExists(tx, dto.receivedByEmployeeId);
      }

      const nextSupplierId = dto.supplierId ?? existing.supplierId;
      const nextPurchaseOrderId =
        dto.purchaseOrderId !== undefined
          ? dto.purchaseOrderId
          : existing.purchaseOrderId;

      if (
        dto.purchaseOrderId !== undefined &&
        dto.purchaseOrderId !== existing.purchaseOrderId
      ) {
        if (!nextPurchaseOrderId) {
          const allowed = await this.settingsService.getBoolean(
            SettingKey.PURCHASE_ALLOW_GRN_WITHOUT_PO,
            false,
          );
          if (!allowed) {
            throw new ApplicationException(
              ErrorCode.GRN_PO_REQUIRED,
              'Purchase order is required for goods receipt',
              HttpStatus.BAD_REQUEST,
            );
          }
        } else {
          await validateGrnPurchaseOrderLink(
            tx,
            scope,
            nextSupplierId,
            nextPurchaseOrderId,
          );
        }
      } else if (nextPurchaseOrderId) {
        await validateGrnPurchaseOrderLink(
          tx,
          scope,
          nextSupplierId,
          nextPurchaseOrderId,
        );
      } else if (!nextPurchaseOrderId) {
        const allowed = await this.settingsService.getBoolean(
          SettingKey.PURCHASE_ALLOW_GRN_WITHOUT_PO,
          false,
        );
        if (!allowed) {
          throw new ApplicationException(
            ErrorCode.GRN_PO_REQUIRED,
            'Purchase order is required for goods receipt',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const updateResult = await tx.goodsReceipt.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          supplierId: dto.supplierId,
          purchaseOrderId: dto.purchaseOrderId,
          receiptDate: dto.receiptDate,
          receivedByEmployeeId: dto.receivedByEmployeeId,
          supplierChallanNo: dto.supplierChallanNo,
          supplierChallanDate: dto.supplierChallanDate,
          supplierInvoiceNo: dto.supplierInvoiceNo,
          supplierInvoiceDate: dto.supplierInvoiceDate,
          vehicleNumber: dto.vehicleNumber,
          isColdChainMaintained: dto.isColdChainMaintained,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Goods receipt version conflict or not found: ${id}`,
      );

      const receipt = await tx.goodsReceipt.findFirstOrThrow({ where: { id } });
      await this.emitChange(tx, receipt, AuditAction.UPDATE);

      return toGoodsReceiptResponse(receipt);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.goodsReceipt.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.GOODS_RECEIPT_NOT_FOUND,
          `Goods receipt not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(
        existing.status,
        'Goods receipt',
        GoodsReceiptStatus.DRAFT,
      );

      const updateResult = await tx.goodsReceipt.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Goods receipt version conflict or not found: ${id}`,
      );

      await this.emitChange(tx, existing, AuditAction.DELETE);

      return { id: id.toString(), deleted: true };
    });
  }

  async submitInspection(id: bigint, dto: PurchaseWorkflowDto) {
    return this.transition(id, dto, {
      from: [GoodsReceiptStatus.DRAFT],
      to: GoodsReceiptStatus.UNDER_INSPECTION,
      action: AuditAction.UPDATE,
      requireItems: true,
    });
  }

  async accept(id: bigint, dto: PurchaseWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const receipt = await tx.goodsReceipt.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
        include: {
          items: { where: { deletedAt: null } },
        },
      });

      if (!receipt) {
        throwNotFound(
          ErrorCode.GOODS_RECEIPT_NOT_FOUND,
          `Goods receipt not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (receipt.status !== GoodsReceiptStatus.UNDER_INSPECTION) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only goods receipts under inspection can be accepted',
          HttpStatus.CONFLICT,
          { status: receipt.status },
        );
      }

      if (receipt.items.length === 0) {
        throw new ApplicationException(
          ErrorCode.DOCUMENT_HAS_NO_ITEMS,
          'Goods receipt must have at least one item',
          HttpStatus.BAD_REQUEST,
          { id: id.toString() },
        );
      }

      const branch = await assertBranchExists(tx, receipt.branchId);
      const userId = this.requestContext.tryGet()?.userId;
      let hasAccepted = false;
      let hasRejected = false;

      for (const item of receipt.items) {
        const stockQty = grnStockQuantity(item);
        if (stockQty.lte(0)) {
          continue;
        }

        hasAccepted = true;
        const batch = await resolveOrCreateBatch(tx, {
          medicineId: item.medicineId,
          batchNumber: item.batchNumber,
          manufacturingDate: item.manufacturingDate,
          expiryDate: item.expiryDate,
          purchaseRate: item.purchaseRate,
          mrp: item.mrp,
          updatedBy: userId,
        });

        await tx.goodsReceiptItem.update({
          where: { id: item.id },
          data: { batchId: batch.id, updatedAt: BigInt(Date.now()) },
        });

        await this.inventoryLedger.applyMovement(tx, {
          branchId: receipt.branchId,
          branchCode: branch.branchCode,
          companyId: branch.companyId,
          medicineId: item.medicineId,
          batchId: batch.id,
          direction: 'IN',
          quantity: stockQty,
          unitCost: item.purchaseRate,
          movementType: StockMovementType.PURCHASE_GRN,
          referenceTable: 'goods_receipts',
          referenceId: receipt.id,
          createdBy: userId,
          remarks: dto.remarks ?? item.remarks ?? undefined,
        });

        if (item.purchaseOrderItemId) {
          const poItem = await tx.purchaseOrderItem.findFirst({
            where: { id: item.purchaseOrderItemId, deletedAt: null },
          });

          if (poItem) {
            const nextReceived = new Prisma.Decimal(
              poItem.receivedQuantity,
            ).add(stockQty);
            await tx.purchaseOrderItem.update({
              where: { id: poItem.id },
              data: {
                receivedQuantity: nextReceived,
                updatedAt: BigInt(Date.now()),
                version: { increment: 1 },
              },
            });
          }
        }
      }

      for (const item of receipt.items) {
        if (new Prisma.Decimal(item.rejectedQuantity).gt(0)) {
          hasRejected = true;
        }
      }

      const nextStatus =
        hasAccepted && hasRejected
          ? GoodsReceiptStatus.PARTIALLY_ACCEPTED
          : hasAccepted
            ? GoodsReceiptStatus.ACCEPTED
            : GoodsReceiptStatus.REJECTED;

      const now = BigInt(Date.now());
      const updateResult = await tx.goodsReceipt.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: nextStatus,
          inspectedByEmployeeId: userId,
          inspectedAt: now,
          updatedAt: now,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Goods receipt version conflict or not found: ${id}`,
      );

      if (receipt.purchaseOrderId) {
        await rollupPurchaseOrderStatus(tx, receipt.purchaseOrderId);
      }

      const updated = await tx.goodsReceipt.findFirstOrThrow({ where: { id } });
      await this.emitChange(tx, updated, AuditAction.POST);

      return toGoodsReceiptResponse(updated);
    });
  }

  async reject(id: bigint, dto: PurchaseWorkflowDto) {
    return this.transition(id, dto, {
      from: [GoodsReceiptStatus.UNDER_INSPECTION],
      to: GoodsReceiptStatus.REJECTED,
      action: AuditAction.REJECT,
    });
  }

  async cancel(id: bigint, dto: PurchaseWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const receipt = await tx.goodsReceipt.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
        include: { items: { where: { deletedAt: null } } },
      });

      if (!receipt) {
        throwNotFound(
          ErrorCode.GOODS_RECEIPT_NOT_FOUND,
          `Goods receipt not found: ${id}`,
          { id: id.toString() },
        );
      }

      const cancellable: string[] = [
        GoodsReceiptStatus.DRAFT,
        GoodsReceiptStatus.UNDER_INSPECTION,
        GoodsReceiptStatus.ACCEPTED,
        GoodsReceiptStatus.PARTIALLY_ACCEPTED,
      ];

      if (!cancellable.includes(receipt.status)) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          `Goods receipt cannot be cancelled from status ${receipt.status}`,
          HttpStatus.CONFLICT,
          { status: receipt.status },
        );
      }

      if (isGrnStockPosted(receipt.status)) {
        const branch = await assertBranchExists(tx, receipt.branchId);
        const userId = this.requestContext.tryGet()?.userId;

        for (const item of receipt.items) {
          if (!item.batchId) {
            continue;
          }

          const stockQty = grnStockQuantity(item);
          if (stockQty.lte(0)) {
            continue;
          }

          await this.inventoryLedger.applyMovement(tx, {
            branchId: receipt.branchId,
            branchCode: branch.branchCode,
            companyId: branch.companyId,
            medicineId: item.medicineId,
            batchId: item.batchId,
            direction: 'OUT',
            quantity: stockQty,
            unitCost: item.purchaseRate,
            movementType: StockMovementType.PURCHASE_GRN,
            referenceTable: 'goods_receipts',
            referenceId: receipt.id,
            createdBy: userId,
            remarks: dto.remarks ?? 'GRN cancellation reversal',
          });

          if (item.purchaseOrderItemId) {
            const poItem = await tx.purchaseOrderItem.findFirst({
              where: { id: item.purchaseOrderItemId, deletedAt: null },
            });

            if (poItem) {
              const nextReceived = new Prisma.Decimal(
                poItem.receivedQuantity,
              ).sub(stockQty);
              await tx.purchaseOrderItem.update({
                where: { id: poItem.id },
                data: {
                  receivedQuantity: nextReceived.lt(0) ? 0 : nextReceived,
                  updatedAt: BigInt(Date.now()),
                  version: { increment: 1 },
                },
              });
            }
          }
        }

        if (receipt.purchaseOrderId) {
          await rollupPurchaseOrderStatus(tx, receipt.purchaseOrderId);
        }
      }

      const updateResult = await tx.goodsReceipt.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: GoodsReceiptStatus.CANCELLED,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Goods receipt version conflict or not found: ${id}`,
      );

      const updated = await tx.goodsReceipt.findFirstOrThrow({ where: { id } });
      await this.emitChange(tx, updated, AuditAction.UPDATE);

      return toGoodsReceiptResponse(updated);
    });
  }

  private async transition(
    id: bigint,
    dto: PurchaseWorkflowDto,
    options: {
      from: string[];
      to: string;
      action: (typeof AuditAction)[keyof typeof AuditAction];
      requireItems?: boolean;
    },
  ) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const receipt = await tx.goodsReceipt.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
        include: { items: { where: { deletedAt: null }, take: 1 } },
      });

      if (!receipt) {
        throwNotFound(
          ErrorCode.GOODS_RECEIPT_NOT_FOUND,
          `Goods receipt not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (!options.from.includes(receipt.status)) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          `Goods receipt cannot transition from ${receipt.status} to ${options.to}`,
          HttpStatus.CONFLICT,
          { status: receipt.status, targetStatus: options.to },
        );
      }

      if (options.requireItems && receipt.items.length === 0) {
        throw new ApplicationException(
          ErrorCode.DOCUMENT_HAS_NO_ITEMS,
          'Goods receipt must have at least one item',
          HttpStatus.BAD_REQUEST,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.goodsReceipt.updateMany({
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
        `Goods receipt version conflict or not found: ${id}`,
      );

      const updated = await tx.goodsReceipt.findFirstOrThrow({ where: { id } });
      await this.emitChange(tx, updated, options.action);

      return toGoodsReceiptResponse(updated);
    });
  }

  private async emitChange(
    tx: Prisma.TransactionClient,
    receipt: { id: bigint; uuid: string; status?: string },
    action: (typeof AuditAction)[keyof typeof AuditAction],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.GOODS_RECEIPT,
      entityId: receipt.id,
      entityUuid: receipt.uuid,
      action,
      module: AuditModule.PURCHASE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.GOODS_RECEIPT,
      entityUuid: receipt.uuid,
      operation:
        action === AuditAction.DELETE
          ? OutboxOperation.DELETE
          : OutboxOperation.UPDATE,
      payload: { uuid: receipt.uuid, status: receipt.status },
    });
  }
}
