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
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { DocumentType } from '../../persistence/sequence/document-type.constants';
import { SequenceGeneratorService } from '../../persistence/sequence/sequence-generator.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { PurchaseOrderStatus } from '../constants/purchase.constants';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { PurchaseWorkflowDto } from '../dto/purchase-workflow.dto';
import { UpdatePurchaseOrderDto } from '../dto/update-purchase-order.dto';
import { toPurchaseOrderResponse } from '../mappers/purchase-order.mapper';
import {
  assertBranchExists,
  assertDraftStatus,
  assertSupplierActive,
  optimisticUpdate,
  throwNotFound,
} from '../utils/purchase.util';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
    private readonly sequences: SequenceGeneratorService,
  ) {}

  async list(query: PaginationQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.PurchaseOrderWhereInput = withBranchScope(scope, {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { purchaseOrderNumber: { contains: search } },
              { remarks: { contains: search } },
            ],
          }
        : {}),
    });

    const [total, rows] = await Promise.all([
      this.prisma.client.purchaseOrder.count({ where }),
      this.prisma.client.purchaseOrder.findMany({
        where,
        orderBy: { orderDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPurchaseOrderResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const order = await this.prisma.client.purchaseOrder.findFirst({
      where: withBranchScope(scope, { id, deletedAt: null }),
    });

    if (!order) {
      throwNotFound(
        ErrorCode.PURCHASE_ORDER_NOT_FOUND,
        `Purchase order not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toPurchaseOrderResponse(order);
  }

  async create(dto: CreatePurchaseOrderDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const branch = await assertBranchExists(tx, dto.branchId);

      if (dto.branchId !== scope.branchId) {
        throw new ApplicationException(
          ErrorCode.FORBIDDEN,
          'Purchase order branch must match request context branch',
          HttpStatus.FORBIDDEN,
          { branchId: dto.branchId.toString() },
        );
      }

      await assertSupplierActive(tx, dto.supplierId);

      const { documentNumber } = await this.sequences.next(tx, {
        companyId: branch.companyId,
        branchId: branch.id,
        documentType: DocumentType.PURCHASE_ORDER,
        branchCode: branch.branchCode,
      });

      const now = BigInt(Date.now());
      const order = await tx.purchaseOrder.create({
        data: {
          uuid: randomUUID(),
          purchaseOrderNumber: documentNumber,
          supplierId: dto.supplierId,
          branchId: dto.branchId,
          orderDate: dto.orderDate,
          expectedDeliveryDate: dto.expectedDeliveryDate,
          grossAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          netAmount: 0,
          status: PurchaseOrderStatus.DRAFT,
          remarks: dto.remarks,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PURCHASE_ORDER,
        entityId: order.id,
        entityUuid: order.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.PURCHASE,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PURCHASE_ORDER,
        entityUuid: order.uuid,
        operation: OutboxOperation.CREATE,
        payload: {
          uuid: order.uuid,
          purchaseOrderNumber: order.purchaseOrderNumber,
        },
      });

      return toPurchaseOrderResponse(order);
    });
  }

  async update(id: bigint, dto: UpdatePurchaseOrderDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.purchaseOrder.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PURCHASE_ORDER_NOT_FOUND,
          `Purchase order not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(existing.status, 'Purchase order');

      if (dto.supplierId) {
        await assertSupplierActive(tx, dto.supplierId);
      }

      const updateResult = await tx.purchaseOrder.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          supplierId: dto.supplierId,
          orderDate: dto.orderDate,
          expectedDeliveryDate: dto.expectedDeliveryDate,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase order version conflict or not found: ${id}`,
      );

      const order = await tx.purchaseOrder.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PURCHASE_ORDER,
        entityId: order.id,
        entityUuid: order.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.PURCHASE,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PURCHASE_ORDER,
        entityUuid: order.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: order.uuid },
      });

      return toPurchaseOrderResponse(order);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.purchaseOrder.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PURCHASE_ORDER_NOT_FOUND,
          `Purchase order not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(existing.status, 'Purchase order');

      const updateResult = await tx.purchaseOrder.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase order version conflict or not found: ${id}`,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PURCHASE_ORDER,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.PURCHASE,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PURCHASE_ORDER,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }

  async submit(id: bigint, dto: PurchaseWorkflowDto) {
    return this.transition(id, dto, {
      from: [PurchaseOrderStatus.DRAFT],
      to: PurchaseOrderStatus.PENDING_APPROVAL,
      action: AuditAction.UPDATE,
      requireItems: true,
    });
  }

  async approve(id: bigint, dto: PurchaseWorkflowDto) {
    return this.transition(id, dto, {
      from: [PurchaseOrderStatus.PENDING_APPROVAL],
      to: PurchaseOrderStatus.APPROVED,
      action: AuditAction.APPROVE,
      setApproval: true,
    });
  }

  async reject(id: bigint, dto: PurchaseWorkflowDto) {
    return this.transition(id, dto, {
      from: [PurchaseOrderStatus.PENDING_APPROVAL],
      to: PurchaseOrderStatus.DRAFT,
      action: AuditAction.REJECT,
    });
  }

  async send(id: bigint, dto: PurchaseWorkflowDto) {
    return this.transition(id, dto, {
      from: [PurchaseOrderStatus.APPROVED],
      to: PurchaseOrderStatus.SENT_TO_SUPPLIER,
      action: AuditAction.UPDATE,
    });
  }

  async forceClose(id: bigint, dto: PurchaseWorkflowDto) {
    return this.transition(id, dto, {
      from: [
        PurchaseOrderStatus.SENT_TO_SUPPLIER,
        PurchaseOrderStatus.PARTIALLY_RECEIVED,
        PurchaseOrderStatus.APPROVED,
      ],
      to: PurchaseOrderStatus.FORCE_CLOSED,
      action: AuditAction.UPDATE,
    });
  }

  async cancel(id: bigint, dto: PurchaseWorkflowDto) {
    return this.transition(id, dto, {
      from: [
        PurchaseOrderStatus.DRAFT,
        PurchaseOrderStatus.PENDING_APPROVAL,
        PurchaseOrderStatus.APPROVED,
        PurchaseOrderStatus.SENT_TO_SUPPLIER,
      ],
      to: PurchaseOrderStatus.CANCELLED,
      action: AuditAction.UPDATE,
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
      setApproval?: boolean;
    },
  ) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const order = await tx.purchaseOrder.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
        include: {
          items: { where: { deletedAt: null }, take: 1 },
        },
      });

      if (!order) {
        throwNotFound(
          ErrorCode.PURCHASE_ORDER_NOT_FOUND,
          `Purchase order not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (!options.from.includes(order.status)) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          `Purchase order cannot transition from ${order.status} to ${options.to}`,
          HttpStatus.CONFLICT,
          { status: order.status, targetStatus: options.to },
        );
      }

      if (options.requireItems && order.items.length === 0) {
        throw new ApplicationException(
          ErrorCode.DOCUMENT_HAS_NO_ITEMS,
          'Purchase order must have at least one item',
          HttpStatus.BAD_REQUEST,
          { id: id.toString() },
        );
      }

      const now = BigInt(Date.now());
      const userId = this.requestContext.tryGet()?.userId;
      const updateResult = await tx.purchaseOrder.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: options.to,
          remarks: dto.remarks ?? order.remarks,
          updatedAt: now,
          version: { increment: 1 },
          ...(options.setApproval
            ? {
                approvedAt: now,
                approvedByEmployeeId: userId,
              }
            : {}),
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase order version conflict or not found: ${id}`,
      );

      const updated = await tx.purchaseOrder.findFirstOrThrow({
        where: { id },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PURCHASE_ORDER,
        entityId: updated.id,
        entityUuid: updated.uuid,
        action: options.action,
        module: AuditModule.PURCHASE,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PURCHASE_ORDER,
        entityUuid: updated.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: updated.uuid, status: updated.status },
      });

      return toPurchaseOrderResponse(updated);
    });
  }
}
