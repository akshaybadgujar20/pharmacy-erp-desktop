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
import {
  FinanceReferenceType,
  ReceiptStatus,
  VoucherType,
} from '../constants/finance.constants';
import { CreateReceiptDto } from '../dto/create-receipt.dto';
import { FinanceWorkflowDto } from '../dto/finance-workflow.dto';
import { ReceiptListQueryDto } from '../dto/receipt-list-query.dto';
import { UpdateReceiptDto } from '../dto/update-receipt.dto';
import { toReceiptResponse } from '../mappers/receipt.mapper';
import {
  adjustCustomerOutstanding,
  assertTransactionDateInOpenYear,
  buildReceiptLedgerLines,
  computeSalesInvoicePaymentStatus,
  isSalesInvoiceReference,
  optimisticUpdate,
  throwNotFound,
} from '../utils/finance.util';

@Injectable()
export class ReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
    private readonly sequences: SequenceGeneratorService,
    private readonly ledgerPosting: LedgerPostingService,
  ) {}

  async list(query: ReceiptListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const referenceId = query.referenceId
      ? BigInt(query.referenceId)
      : undefined;
    const dateFrom = query.dateFrom ? BigInt(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? BigInt(query.dateTo) : undefined;

    const where: Prisma.ReceiptWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.receiptType ? { receiptType: query.receiptType } : {}),
      ...(query.referenceType ? { referenceType: query.referenceType } : {}),
      ...(referenceId ? { referenceId } : {}),
      ...(dateFrom || dateTo
        ? {
            receiptDate: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { receiptNumber: { contains: search } },
              { transactionReference: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.receipt.count({ where }),
      this.prisma.client.receipt.findMany({
        where,
        orderBy: { receiptDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toReceiptResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const receipt = await this.prisma.client.receipt.findFirst({
      where: { id, deletedAt: null },
    });

    if (!receipt) {
      throwNotFound(ErrorCode.RECEIPT_NOT_FOUND, `Receipt not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toReceiptResponse(receipt);
  }

  async create(dto: CreateReceiptDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const branch = await tx.branch.findFirstOrThrow({
        where: { id: scope.branchId, deletedAt: null },
        select: { id: true, branchCode: true, companyId: true },
      });

      const { documentNumber } = await this.sequences.next(tx, {
        companyId: branch.companyId,
        branchId: branch.id,
        documentType: DocumentType.RECEIPT,
        branchCode: branch.branchCode,
      });

      const now = BigInt(Date.now());
      const receipt = await tx.receipt.create({
        data: {
          uuid: randomUUID(),
          receiptNumber: documentNumber,
          receiptType: dto.receiptType,
          receiptDate: dto.receiptDate,
          amount: dto.amount,
          receiptMethod: dto.receiptMethod,
          transactionReference: dto.transactionReference,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          status: ReceiptStatus.PENDING,
          remarks: dto.remarks,
          createdBy: this.requestContext.tryGet()?.userId,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        receipt,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toReceiptResponse(receipt);
    });
  }

  async update(id: bigint, dto: UpdateReceiptDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.receipt.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.RECEIPT_NOT_FOUND, `Receipt not found: ${id}`, {
          id: id.toString(),
        });
      }

      this.assertPendingStatus(existing.status, 'Receipt');

      const updateResult = await tx.receipt.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          receiptType: dto.receiptType,
          receiptDate: dto.receiptDate,
          amount: dto.amount,
          receiptMethod: dto.receiptMethod,
          transactionReference: dto.transactionReference,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(updateResult, id, `Receipt version conflict: ${id}`);

      const receipt = await tx.receipt.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        receipt,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toReceiptResponse(receipt);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.receipt.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.RECEIPT_NOT_FOUND, `Receipt not found: ${id}`, {
          id: id.toString(),
        });
      }

      this.assertPendingStatus(existing.status, 'Receipt');

      const updateResult = await tx.receipt.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(updateResult, id, `Receipt version conflict: ${id}`);

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

      const receipt = await tx.receipt.findFirst({
        where: { id, deletedAt: null },
      });

      if (!receipt) {
        throwNotFound(ErrorCode.RECEIPT_NOT_FOUND, `Receipt not found: ${id}`, {
          id: id.toString(),
        });
      }

      if (receipt.status !== ReceiptStatus.PENDING) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only pending receipts can be completed',
          HttpStatus.CONFLICT,
          { status: receipt.status },
        );
      }

      await assertTransactionDateInOpenYear(
        tx,
        branch.companyId,
        receipt.receiptDate,
      );

      const amount = new Prisma.Decimal(receipt.amount);
      let customerId: bigint | undefined;

      if (isSalesInvoiceReference(receipt.referenceType)) {
        if (!receipt.referenceId) {
          throw new ApplicationException(
            ErrorCode.BAD_REQUEST,
            'Sales invoice reference is required',
            HttpStatus.BAD_REQUEST,
          );
        }

        const invoice = await tx.salesInvoice.findFirst({
          where: { id: receipt.referenceId, deletedAt: null },
        });

        if (!invoice) {
          throwNotFound(
            ErrorCode.SALES_INVOICE_NOT_FOUND,
            `Sales invoice not found: ${receipt.referenceId}`,
            { id: receipt.referenceId.toString() },
          );
        }

        if (amount.gt(invoice.balanceAmount)) {
          throw new ApplicationException(
            ErrorCode.BAD_REQUEST,
            'Receipt amount exceeds sales invoice balance',
            HttpStatus.BAD_REQUEST,
            {
              receiptAmount: amount.toString(),
              balanceAmount: invoice.balanceAmount.toString(),
            },
          );
        }

        customerId = invoice.customerId ?? undefined;
      } else if (receipt.referenceType === FinanceReferenceType.CUSTOMER) {
        customerId = receipt.referenceId ?? undefined;
      }

      const lines = await buildReceiptLedgerLines(tx, {
        amount,
        receiptMethod: receipt.receiptMethod,
        narration: receipt.remarks ?? undefined,
      });

      await this.ledgerPosting.postVoucher(tx, {
        companyId: branch.companyId,
        voucherType: VoucherType.RECEIPT,
        voucherId: receipt.id,
        voucherNumber: receipt.receiptNumber,
        transactionDate: receipt.receiptDate,
        lines,
        createdBy: this.requestContext.tryGet()?.userId,
      });

      const updateResult = await tx.receipt.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: ReceiptStatus.COMPLETED,
          remarks: dto.remarks ?? receipt.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(updateResult, id, `Receipt version conflict: ${id}`);

      if (
        isSalesInvoiceReference(receipt.referenceType) &&
        receipt.referenceId
      ) {
        const invoice = await tx.salesInvoice.findFirstOrThrow({
          where: { id: receipt.referenceId },
        });

        const paidAmount = new Prisma.Decimal(invoice.paidAmount).add(amount);
        const balanceAmount = new Prisma.Decimal(invoice.netAmount).sub(
          paidAmount,
        );

        await tx.salesInvoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount,
            balanceAmount,
            paymentStatus: computeSalesInvoicePaymentStatus(
              new Prisma.Decimal(invoice.netAmount),
              paidAmount,
            ),
            updatedAt: BigInt(Date.now()),
          },
        });
      }

      if (customerId) {
        await adjustCustomerOutstanding(tx, customerId, amount.neg());
      }

      const updated = await tx.receipt.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        updated,
        AuditAction.POST,
        OutboxOperation.UPDATE,
      );
      return toReceiptResponse(updated);
    });
  }

  async cancel(id: bigint, dto: FinanceWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const branch = await tx.branch.findFirstOrThrow({
        where: { id: scope.branchId, deletedAt: null },
        select: { companyId: true },
      });

      const receipt = await tx.receipt.findFirst({
        where: { id, deletedAt: null },
      });

      if (!receipt) {
        throwNotFound(ErrorCode.RECEIPT_NOT_FOUND, `Receipt not found: ${id}`, {
          id: id.toString(),
        });
      }

      if (
        receipt.status !== ReceiptStatus.PENDING &&
        receipt.status !== ReceiptStatus.COMPLETED
      ) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only pending or completed receipts can be cancelled',
          HttpStatus.CONFLICT,
          { status: receipt.status },
        );
      }

      const amount = new Prisma.Decimal(receipt.amount);
      let customerId: bigint | undefined;

      if (receipt.status === ReceiptStatus.COMPLETED) {
        await this.ledgerPosting.reverseVoucher(tx, {
          companyId: branch.companyId,
          voucherType: VoucherType.RECEIPT,
          voucherId: receipt.id,
          reversalVoucherType: VoucherType.RECEIPT,
          reversalVoucherId: receipt.id,
          reversalVoucherNumber: `${receipt.receiptNumber}-REV`,
          transactionDate: BigInt(Date.now()),
          createdBy: this.requestContext.tryGet()?.userId,
          narration: dto.remarks,
        });

        if (
          isSalesInvoiceReference(receipt.referenceType) &&
          receipt.referenceId
        ) {
          const invoice = await tx.salesInvoice.findFirstOrThrow({
            where: { id: receipt.referenceId },
          });

          const paidAmount = new Prisma.Decimal(invoice.paidAmount).sub(amount);
          const balanceAmount = new Prisma.Decimal(invoice.netAmount).sub(
            paidAmount,
          );

          await tx.salesInvoice.update({
            where: { id: invoice.id },
            data: {
              paidAmount,
              balanceAmount,
              paymentStatus: computeSalesInvoicePaymentStatus(
                new Prisma.Decimal(invoice.netAmount),
                paidAmount,
              ),
              updatedAt: BigInt(Date.now()),
            },
          });

          customerId = invoice.customerId ?? undefined;
        } else if (receipt.referenceType === FinanceReferenceType.CUSTOMER) {
          customerId = receipt.referenceId ?? undefined;
        }
      }

      const updateResult = await tx.receipt.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: ReceiptStatus.CANCELLED,
          remarks: dto.remarks ?? receipt.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(updateResult, id, `Receipt version conflict: ${id}`);

      if (customerId && receipt.status === ReceiptStatus.COMPLETED) {
        await adjustCustomerOutstanding(tx, customerId, amount);
      }

      const updated = await tx.receipt.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        updated,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toReceiptResponse(updated);
    });
  }

  private assertPendingStatus(status: string, entityLabel: string): void {
    if (status !== ReceiptStatus.PENDING) {
      throw new ApplicationException(
        ErrorCode.INVALID_DOCUMENT_STATUS,
        `${entityLabel} can only be modified while in ${ReceiptStatus.PENDING} status`,
        HttpStatus.CONFLICT,
        { status },
      );
    }
  }

  private async emitChange(
    tx: Prisma.TransactionClient,
    receipt: { id: bigint; uuid: string; status?: string },
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.RECEIPT,
      entityId: receipt.id,
      entityUuid: receipt.uuid,
      action,
      module: AuditModule.FINANCE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.RECEIPT,
      entityUuid: receipt.uuid,
      operation,
      payload: { uuid: receipt.uuid, status: receipt.status },
    });
  }
}
