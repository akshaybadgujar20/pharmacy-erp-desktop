import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { getTenantScope } from '../../persistence/context/tenant-scope.util';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { LedgerPostingService } from '../../persistence/ledger/ledger-posting.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { DocumentType } from '../../persistence/sequence/document-type.constants';
import { SequenceGeneratorService } from '../../persistence/sequence/sequence-generator.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { PurchaseInvoiceStatus } from '../../purchase/constants/purchase.constants';
import { PaymentStatus, VoucherType } from '../constants/finance.constants';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { FinanceWorkflowDto } from '../dto/finance-workflow.dto';
import { PaymentListQueryDto } from '../dto/payment-list-query.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { toPaymentResponse } from '../mappers/payment.mapper';
import {
  adjustPurchaseInvoicePaymentAllocation,
  adjustSupplierOutstanding,
  assertPaymentTypeSupportsLedger,
  assertTransactionDateInOpenYear,
  buildPaymentLedgerLines,
  isPurchaseInvoiceReference,
  optimisticUpdate,
  throwNotFound,
} from '../utils/finance.util';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
    private readonly sequences: SequenceGeneratorService,
    private readonly ledgerPosting: LedgerPostingService,
  ) {}

  async list(query: PaymentListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const referenceId = query.referenceId
      ? BigInt(query.referenceId)
      : undefined;
    const dateFrom = query.dateFrom ? BigInt(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? BigInt(query.dateTo) : undefined;

    const where: Prisma.PaymentWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.paymentType ? { paymentType: query.paymentType } : {}),
      ...(query.referenceType ? { referenceType: query.referenceType } : {}),
      ...(referenceId ? { referenceId } : {}),
      ...(dateFrom || dateTo
        ? {
            paymentDate: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { paymentNumber: { contains: search } },
              { transactionReference: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.payment.count({ where }),
      this.prisma.client.payment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPaymentResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const payment = await this.prisma.client.payment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!payment) {
      throwNotFound(ErrorCode.PAYMENT_NOT_FOUND, `Payment not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toPaymentResponse(payment);
  }

  async create(dto: CreatePaymentDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const branch = await tx.branch.findFirstOrThrow({
        where: { id: scope.branchId, deletedAt: null },
        select: { id: true, branchCode: true, companyId: true },
      });

      const { documentNumber } = await this.sequences.next(tx, {
        companyId: branch.companyId,
        branchId: branch.id,
        documentType: DocumentType.PAYMENT,
        branchCode: branch.branchCode,
      });

      const now = BigInt(Date.now());
      const payment = await tx.payment.create({
        data: {
          uuid: randomUUID(),
          paymentNumber: documentNumber,
          paymentType: dto.paymentType,
          paymentDate: dto.paymentDate,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          transactionReference: dto.transactionReference,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          status: PaymentStatus.PENDING,
          remarks: dto.remarks,
          createdBy: this.requestContext.tryGet()?.userId,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        payment,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toPaymentResponse(payment);
    });
  }

  async update(id: bigint, dto: UpdatePaymentDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.payment.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.PAYMENT_NOT_FOUND, `Payment not found: ${id}`, {
          id: id.toString(),
        });
      }

      this.assertPendingStatus(existing.status, 'Payment');

      const updateResult = await tx.payment.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          paymentType: dto.paymentType,
          paymentDate: dto.paymentDate,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          transactionReference: dto.transactionReference,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(updateResult, id, `Payment version conflict: ${id}`);

      const payment = await tx.payment.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        payment,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toPaymentResponse(payment);
    });
  }

  async delete(id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.payment.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.PAYMENT_NOT_FOUND, `Payment not found: ${id}`, {
          id: id.toString(),
        });
      }

      this.assertPendingStatus(existing.status, 'Payment');

      const updateResult = await tx.payment.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(updateResult, id, `Payment version conflict: ${id}`);

      await this.emitChange(
        tx,
        existing,
        AuditAction.DELETE,
        OutboxOperation.DELETE,
      );
      return { id: id.toString(), deleted: true };
    });
  }

  async complete(id: bigint, dto: FinanceWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const branch = await tx.branch.findFirstOrThrow({
        where: { id: scope.branchId, deletedAt: null },
        select: { companyId: true },
      });

      const payment = await tx.payment.findFirst({
        where: { id, deletedAt: null },
      });

      if (!payment) {
        throwNotFound(ErrorCode.PAYMENT_NOT_FOUND, `Payment not found: ${id}`, {
          id: id.toString(),
        });
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only pending payments can be completed',
          HttpStatus.CONFLICT,
          { status: payment.status },
        );
      }

      await assertTransactionDateInOpenYear(
        tx,
        branch.companyId,
        payment.paymentDate,
      );

      const amount = new Prisma.Decimal(payment.amount);
      let supplierId: bigint | undefined;

      assertPaymentTypeSupportsLedger(payment.paymentType);

      if (isPurchaseInvoiceReference(payment.referenceType)) {
        if (!payment.referenceId) {
          throw new ApplicationException(
            ErrorCode.BAD_REQUEST,
            'Purchase invoice reference is required for supplier payment allocation',
            HttpStatus.BAD_REQUEST,
          );
        }

        const invoice = await tx.purchaseInvoice.findFirst({
          where: { id: payment.referenceId, deletedAt: null },
        });

        if (!invoice) {
          throwNotFound(
            ErrorCode.PURCHASE_INVOICE_NOT_FOUND,
            `Purchase invoice not found: ${payment.referenceId}`,
            { id: payment.referenceId.toString() },
          );
        }

        if (invoice.status !== PurchaseInvoiceStatus.POSTED) {
          throw new ApplicationException(
            ErrorCode.INVOICE_NOT_POSTED,
            'Purchase invoice must be posted before payment allocation',
            HttpStatus.CONFLICT,
            { status: invoice.status },
          );
        }

        if (amount.gt(invoice.balanceAmount)) {
          throw new ApplicationException(
            ErrorCode.PAYMENT_ALLOCATION_EXCEEDED,
            'Payment amount exceeds purchase invoice balance',
            HttpStatus.BAD_REQUEST,
            {
              paymentAmount: amount.toString(),
              balanceAmount: invoice.balanceAmount.toString(),
            },
          );
        }
      }

      const lines = await buildPaymentLedgerLines(tx, {
        amount,
        paymentMethod: payment.paymentMethod,
        paymentType: payment.paymentType,
        narration: payment.remarks ?? undefined,
      });

      await this.ledgerPosting.postVoucher(tx, {
        companyId: branch.companyId,
        voucherType: VoucherType.PAYMENT,
        voucherId: payment.id,
        voucherNumber: payment.paymentNumber,
        transactionDate: payment.paymentDate,
        lines,
        createdBy: this.requestContext.tryGet()?.userId,
      });

      const updateResult = await tx.payment.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: PaymentStatus.COMPLETED,
          remarks: dto.remarks ?? payment.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(updateResult, id, `Payment version conflict: ${id}`);

      if (
        isPurchaseInvoiceReference(payment.referenceType) &&
        payment.referenceId
      ) {
        const allocation = await adjustPurchaseInvoicePaymentAllocation(
          tx,
          payment.referenceId,
          amount,
        );
        supplierId = allocation.supplierId;
      }

      if (supplierId) {
        await adjustSupplierOutstanding(tx, supplierId, amount.neg());
      }

      const updated = await tx.payment.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        updated,
        AuditAction.POST,
        OutboxOperation.UPDATE,
      );
      return toPaymentResponse(updated);
    });
  }

  async cancel(id: bigint, dto: FinanceWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const branch = await tx.branch.findFirstOrThrow({
        where: { id: scope.branchId, deletedAt: null },
        select: { companyId: true },
      });

      const payment = await tx.payment.findFirst({
        where: { id, deletedAt: null },
      });

      if (!payment) {
        throwNotFound(ErrorCode.PAYMENT_NOT_FOUND, `Payment not found: ${id}`, {
          id: id.toString(),
        });
      }

      if (
        payment.status !== PaymentStatus.PENDING &&
        payment.status !== PaymentStatus.COMPLETED
      ) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only pending or completed payments can be cancelled',
          HttpStatus.CONFLICT,
          { status: payment.status },
        );
      }

      const amount = new Prisma.Decimal(payment.amount);
      let supplierId: bigint | undefined;

      if (payment.status === PaymentStatus.COMPLETED) {
        await this.ledgerPosting.reverseVoucher(tx, {
          companyId: branch.companyId,
          originalVoucherType: VoucherType.PAYMENT,
          originalVoucherId: payment.id,
          originalVoucherNumber: payment.paymentNumber,
          reversalVoucherType: VoucherType.PAYMENT,
          reversalVoucherId: payment.id,
          reversalVoucherNumber: `${payment.paymentNumber}-REV`,
          transactionDate: BigInt(Date.now()),
          createdBy: this.requestContext.tryGet()?.userId,
          narration: dto.remarks,
        });

        if (
          isPurchaseInvoiceReference(payment.referenceType) &&
          payment.referenceId
        ) {
          const allocation = await adjustPurchaseInvoicePaymentAllocation(
            tx,
            payment.referenceId,
            amount.neg(),
          );
          supplierId = allocation.supplierId;
        }
      }

      const updateResult = await tx.payment.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: PaymentStatus.CANCELLED,
          remarks: dto.remarks ?? payment.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(updateResult, id, `Payment version conflict: ${id}`);

      if (supplierId && payment.status === PaymentStatus.COMPLETED) {
        await adjustSupplierOutstanding(tx, supplierId, amount);
      }

      const updated = await tx.payment.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        updated,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toPaymentResponse(updated);
    });
  }

  private assertPendingStatus(status: string, entityLabel: string): void {
    if (status !== PaymentStatus.PENDING) {
      throw new ApplicationException(
        ErrorCode.INVALID_DOCUMENT_STATUS,
        `${entityLabel} can only be modified while in ${PaymentStatus.PENDING} status`,
        HttpStatus.CONFLICT,
        { status },
      );
    }
  }

  private async emitChange(
    tx: Prisma.TransactionClient,
    payment: { id: bigint; uuid: string; status?: string },
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.PAYMENT,
      entityId: payment.id,
      entityUuid: payment.uuid,
      action,
      module: AuditModule.FINANCE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.PAYMENT,
      entityUuid: payment.uuid,
      operation,
      payload: { uuid: payment.uuid, status: payment.status },
    });
  }
}
