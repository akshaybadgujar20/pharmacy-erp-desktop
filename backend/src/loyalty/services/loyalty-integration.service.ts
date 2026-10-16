import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, SalesInvoice } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { LoyaltyTransactionType } from '../constants/loyalty.constants';

@Injectable()
export class LoyaltyIntegrationService {
  constructor(private readonly outboxService: OutboxService) {}

  async applyForPostedInvoice(
    tx: TxClient,
    invoice: SalesInvoice,
    options?: { redeemPoints?: number; operationId?: string },
  ): Promise<void> {
    if (!invoice.customerId) {
      return;
    }

    const program = await tx.loyaltyProgram.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        isDefault: true,
        effectiveFrom: { lte: invoice.invoiceDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: invoice.invoiceDate } }],
      },
    });
    if (!program) {
      return;
    }

    const membership = await tx.customerLoyaltyMembership.findFirst({
      where: {
        customerId: invoice.customerId,
        loyaltyProgramId: program.id,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
    if (!membership) {
      return;
    }

    const customer = await tx.customer.findFirstOrThrow({
      where: { id: invoice.customerId },
    });

    let balance = customer.loyaltyPoints;
    const now = BigInt(Date.now());
    const redeemPoints = options?.redeemPoints ?? 0;

    if (redeemPoints > 0) {
      if (redeemPoints < program.minimumRedemptionPoints) {
        throw new ApplicationException(
          ErrorCode.LOYALTY_INSUFFICIENT_POINTS,
          'Redemption below minimum points',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (balance < redeemPoints) {
        throw new ApplicationException(
          ErrorCode.LOYALTY_INSUFFICIENT_POINTS,
          'Insufficient loyalty points',
          HttpStatus.CONFLICT,
          { balance: String(balance), redeemPoints: String(redeemPoints) },
        );
      }
      balance -= redeemPoints;
      await this.writeTransaction(tx, {
        program,
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        points: -redeemPoints,
        type: LoyaltyTransactionType.REDEEM,
        balance,
        date: invoice.invoiceDate,
        operationId: `${options?.operationId ?? invoice.uuid}:redeem`,
      });
    }

    const net = new Prisma.Decimal(invoice.netAmount);
    const ratio = new Prisma.Decimal(program.pointsPerAmount);
    const earned =
      ratio.gt(0) ? Math.floor(net.div(ratio).toNumber()) : 0;

    if (earned > 0) {
      balance += earned;
      await this.writeTransaction(tx, {
        program,
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        points: earned,
        type: LoyaltyTransactionType.EARN,
        balance,
        date: invoice.invoiceDate,
        operationId: `${options?.operationId ?? invoice.uuid}:earn`,
      });
    }

    await tx.customer.update({
      where: { id: invoice.customerId },
      data: { loyaltyPoints: balance, updatedAt: now },
    });
  }

  async reverseForApprovedReturn(
    tx: TxClient,
    input: {
      customerId: bigint;
      salesInvoiceId: bigint;
      returnNetAmount: Prisma.Decimal;
      returnDate: bigint;
      operationId: string;
    },
  ): Promise<void> {
    const transactions = await tx.loyaltyTransaction.findMany({
      where: {
        customerId: input.customerId,
        salesInvoiceId: input.salesInvoiceId,
        deletedAt: null,
      },
    });
    if (transactions.length === 0) {
      return;
    }

    const customer = await tx.customer.findFirstOrThrow({
      where: { id: input.customerId },
    });
    let balance = customer.loyaltyPoints;
    const now = BigInt(Date.now());

    for (const txn of transactions) {
      const reversalPoints = -txn.points;
      if (reversalPoints === 0) {
        continue;
      }
      balance += reversalPoints;
      await this.writeTransaction(tx, {
        program: { id: txn.loyaltyProgramId },
        customerId: input.customerId,
        invoiceId: input.salesInvoiceId,
        points: reversalPoints,
        type: LoyaltyTransactionType.REVERSAL,
        balance,
        date: input.returnDate,
        operationId: `${input.operationId}:rev:${txn.uuid}`,
      });
    }

    await tx.customer.update({
      where: { id: input.customerId },
      data: { loyaltyPoints: balance, updatedAt: now },
    });
  }

  private async writeTransaction(
    tx: TxClient,
    input: {
      program: { id: bigint };
      customerId: bigint;
      invoiceId: bigint;
      points: number;
      type: string;
      balance: number;
      date: bigint;
      operationId: string;
    },
  ) {
    const now = BigInt(Date.now());
    const txn = await tx.loyaltyTransaction.create({
      data: {
        uuid: randomUUID(),
        loyaltyProgramId: input.program.id,
        customerId: input.customerId,
        salesInvoiceId: input.invoiceId,
        transactionNumber: `LT-${input.operationId}`,
        transactionType: input.type,
        transactionDate: input.date,
        points: input.points,
        balanceAfterTransaction: input.balance,
        createdAt: now,
        updatedAt: now,
      },
    });
    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.LOYALTY_TRANSACTION,
      entityUuid: txn.uuid,
      operation: OutboxOperation.CREATE,
      operationId: input.operationId,
      payload: { uuid: txn.uuid, points: input.points, type: input.type },
    });
  }
}
