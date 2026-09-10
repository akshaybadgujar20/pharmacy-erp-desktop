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
import { VoucherType } from '../../finance/constants/finance.constants';
import {
  adjustCustomerOutstanding,
  assertTransactionDateInOpenYear,
  buildSalesPaymentLedgerLines,
  recomputeSalesInvoiceSettlement,
} from '../../finance/utils/finance.util';
import {
  getTenantScope,
  withBranchScope,
} from '../../persistence/context/tenant-scope.util';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { LedgerPostingService } from '../../persistence/ledger/ledger-posting.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { DocumentType } from '../../persistence/sequence/document-type.constants';
import { SequenceGeneratorService } from '../../persistence/sequence/sequence-generator.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { SalesPaymentStatus } from '../constants/sales.constants';
import { CreateSalesPaymentDto } from '../dto/create-sales-payment.dto';
import { SalesWorkflowDto } from '../dto/sales-workflow.dto';
import { UpdateSalesPaymentDto } from '../dto/update-sales-payment.dto';
import { assertBranchExists } from '../../configuration/utils/configuration.util';
import { toSalesPaymentResponse } from '../mappers/sales-payment.mapper';
import {
  assertInvoicePosted,
  optimisticUpdate,
  throwNotFound,
} from '../utils/sales.util';

@Injectable()
export class SalesPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
    private readonly sequences: SequenceGeneratorService,
    private readonly ledgerPosting: LedgerPostingService,
  ) {}

  private async findParent(salesInvoiceId: bigint) {
    const scope = getTenantScope(this.requestContext);
    const invoice = await this.prisma.client.salesInvoice.findFirst({
      where: withBranchScope(scope, { id: salesInvoiceId, deletedAt: null }),
    });

    if (!invoice) {
      throwNotFound(
        ErrorCode.SALES_INVOICE_NOT_FOUND,
        `Sales invoice not found: ${salesInvoiceId}`,
        { salesInvoiceId: salesInvoiceId.toString() },
      );
    }

    return invoice;
  }

  private async findParentTx(
    tx: Prisma.TransactionClient,
    salesInvoiceId: bigint,
  ) {
    const scope = getTenantScope(this.requestContext);
    const invoice = await tx.salesInvoice.findFirst({
      where: withBranchScope(scope, { id: salesInvoiceId, deletedAt: null }),
    });

    if (!invoice) {
      throwNotFound(
        ErrorCode.SALES_INVOICE_NOT_FOUND,
        `Sales invoice not found: ${salesInvoiceId}`,
        { salesInvoiceId: salesInvoiceId.toString() },
      );
    }

    return invoice;
  }

  async list(salesInvoiceId: bigint, query: PaginationQueryDto) {
    await this.findParent(salesInvoiceId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.SalesPaymentWhereInput = {
      salesInvoiceId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.salesPayment.count({ where }),
      this.prisma.client.salesPayment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toSalesPaymentResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(salesInvoiceId: bigint, id: bigint) {
    await this.findParent(salesInvoiceId);
    const payment = await this.findActivePayment(salesInvoiceId, id);
    return toSalesPaymentResponse(payment);
  }

  async create(salesInvoiceId: bigint, dto: CreateSalesPaymentDto) {
    return this.unitOfWork.run(async (tx) => {
      const invoice = await this.findParentTx(tx, salesInvoiceId);
      assertInvoicePosted(invoice.status);

      const branch = await assertBranchExists(tx, invoice.branchId);
      const { documentNumber } = await this.sequences.next(tx, {
        companyId: branch.companyId,
        branchId: branch.id,
        documentType: DocumentType.SALES_PAYMENT,
        branchCode: branch.branchCode,
      });

      const paymentAmount = new Prisma.Decimal(dto.paymentAmount);
      if (paymentAmount.gt(invoice.balanceAmount)) {
        throw new ApplicationException(
          ErrorCode.BAD_REQUEST,
          'Payment amount exceeds invoice balance',
          HttpStatus.BAD_REQUEST,
          {
            paymentAmount: paymentAmount.toString(),
            balanceAmount: invoice.balanceAmount.toString(),
          },
        );
      }

      const now = BigInt(Date.now());
      const payment = await tx.salesPayment.create({
        data: {
          uuid: randomUUID(),
          paymentNumber: documentNumber,
          salesInvoiceId,
          branchId: invoice.branchId,
          paymentDate: dto.paymentDate,
          paymentMethod: dto.paymentMethod,
          paymentAmount: dto.paymentAmount,
          tenderedAmount: dto.tenderedAmount,
          changeReturned: dto.changeReturned ?? 0,
          transactionReference: dto.transactionReference,
          cardLast4Digits: dto.cardLast4Digits,
          cardType: dto.cardType,
          posTerminalId: dto.posTerminalId,
          bankName: dto.bankName,
          chequeNumber: dto.chequeNumber,
          chequeDate: dto.chequeDate,
          status: SalesPaymentStatus.PENDING,
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
      return toSalesPaymentResponse(payment);
    });
  }

  async update(salesInvoiceId: bigint, id: bigint, dto: UpdateSalesPaymentDto) {
    return this.unitOfWork.run(async (tx) => {
      const invoice = await this.findParentTx(tx, salesInvoiceId);
      const existing = await tx.salesPayment.findFirst({
        where: { id, salesInvoiceId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.SALES_PAYMENT_NOT_FOUND,
          `Sales payment not found: ${id}`,
          { id: id.toString() },
        );
      }

      this.assertPendingStatus(existing.status);

      if (dto.paymentAmount != null) {
        const paymentAmount = new Prisma.Decimal(dto.paymentAmount);
        if (paymentAmount.gt(invoice.balanceAmount)) {
          throw new ApplicationException(
            ErrorCode.BAD_REQUEST,
            'Payment amount exceeds sales invoice balance',
            HttpStatus.BAD_REQUEST,
            {
              paymentAmount: paymentAmount.toString(),
              balanceAmount: invoice.balanceAmount.toString(),
            },
          );
        }
      }

      const updateResult = await tx.salesPayment.updateMany({
        where: { id, salesInvoiceId, version: dto.version, deletedAt: null },
        data: {
          paymentDate: dto.paymentDate,
          paymentMethod: dto.paymentMethod,
          paymentAmount: dto.paymentAmount,
          tenderedAmount: dto.tenderedAmount,
          changeReturned: dto.changeReturned,
          transactionReference: dto.transactionReference,
          cardLast4Digits: dto.cardLast4Digits,
          cardType: dto.cardType,
          posTerminalId: dto.posTerminalId,
          bankName: dto.bankName,
          chequeNumber: dto.chequeNumber,
          chequeDate: dto.chequeDate,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales payment version conflict or not found: ${id}`,
      );

      const payment = await tx.salesPayment.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        payment,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toSalesPaymentResponse(payment);
    });
  }

  async delete(salesInvoiceId: bigint, id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      await this.findParentTx(tx, salesInvoiceId);
      const existing = await tx.salesPayment.findFirst({
        where: { id, salesInvoiceId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.SALES_PAYMENT_NOT_FOUND,
          `Sales payment not found: ${id}`,
          { id: id.toString() },
        );
      }

      this.assertPendingStatus(existing.status);

      const updateResult = await tx.salesPayment.updateMany({
        where: { id, salesInvoiceId, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales payment version conflict or not found: ${id}`,
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

  async complete(salesInvoiceId: bigint, id: bigint, dto: SalesWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const invoice = await this.findParentTx(tx, salesInvoiceId);
      assertInvoicePosted(invoice.status);

      const payment = await tx.salesPayment.findFirst({
        where: { id, salesInvoiceId, deletedAt: null },
      });

      if (!payment) {
        throwNotFound(
          ErrorCode.SALES_PAYMENT_NOT_FOUND,
          `Sales payment not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (payment.status !== SalesPaymentStatus.PENDING) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only pending sales payments can be completed',
          HttpStatus.CONFLICT,
          { status: payment.status },
        );
      }

      const branch = await assertBranchExists(tx, payment.branchId);
      await assertTransactionDateInOpenYear(
        tx,
        branch.companyId,
        payment.paymentDate,
      );

      if (!invoice.customerId) {
        throw new ApplicationException(
          ErrorCode.BAD_REQUEST,
          'Sales payment requires a customer on the invoice',
          HttpStatus.BAD_REQUEST,
          { salesInvoiceId: salesInvoiceId.toString() },
        );
      }

      const amount = new Prisma.Decimal(payment.paymentAmount);
      const lines = await buildSalesPaymentLedgerLines(tx, {
        amount,
        paymentMethod: payment.paymentMethod,
        customerId: invoice.customerId,
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

      const updateResult = await tx.salesPayment.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: SalesPaymentStatus.COMPLETED,
          remarks: dto.remarks ?? payment.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales payment version conflict or not found: ${id}`,
      );

      await recomputeSalesInvoiceSettlement(tx, salesInvoiceId);

      if (invoice.customerId) {
        await adjustCustomerOutstanding(tx, invoice.customerId, amount.neg());
      }

      const updated = await tx.salesPayment.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        updated,
        AuditAction.POST,
        OutboxOperation.UPDATE,
      );
      return toSalesPaymentResponse(updated);
    });
  }

  async cancel(salesInvoiceId: bigint, id: bigint, dto: SalesWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const invoice = await this.findParentTx(tx, salesInvoiceId);
      const payment = await tx.salesPayment.findFirst({
        where: { id, salesInvoiceId, deletedAt: null },
      });

      if (!payment) {
        throwNotFound(
          ErrorCode.SALES_PAYMENT_NOT_FOUND,
          `Sales payment not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (
        payment.status !== SalesPaymentStatus.PENDING &&
        payment.status !== SalesPaymentStatus.COMPLETED
      ) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only pending or completed sales payments can be cancelled',
          HttpStatus.CONFLICT,
          { status: payment.status },
        );
      }

      const amount = new Prisma.Decimal(payment.paymentAmount);

      if (payment.status === SalesPaymentStatus.COMPLETED) {
        const branch = await assertBranchExists(tx, payment.branchId);
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

        await recomputeSalesInvoiceSettlement(tx, salesInvoiceId);

        if (invoice.customerId) {
          await adjustCustomerOutstanding(tx, invoice.customerId, amount);
        }
      }

      const updateResult = await tx.salesPayment.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: SalesPaymentStatus.CANCELLED,
          remarks: dto.remarks ?? payment.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales payment version conflict or not found: ${id}`,
      );

      const updated = await tx.salesPayment.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        updated,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toSalesPaymentResponse(updated);
    });
  }

  private async findActivePayment(salesInvoiceId: bigint, id: bigint) {
    const payment = await this.prisma.client.salesPayment.findFirst({
      where: { id, salesInvoiceId, deletedAt: null },
    });

    if (!payment) {
      throwNotFound(
        ErrorCode.SALES_PAYMENT_NOT_FOUND,
        `Sales payment not found: ${id}`,
        { id: id.toString() },
      );
    }

    return payment;
  }

  private assertPendingStatus(status: string): void {
    if (status !== SalesPaymentStatus.PENDING) {
      throw new ApplicationException(
        ErrorCode.INVALID_DOCUMENT_STATUS,
        'Only pending sales payments can be modified',
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
      entityType: OutboxEntityType.SALES_PAYMENT,
      entityId: payment.id,
      entityUuid: payment.uuid,
      action,
      module: AuditModule.SALES,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.SALES_PAYMENT,
      entityUuid: payment.uuid,
      operation,
      payload: { uuid: payment.uuid, status: payment.status },
    });
  }
}
