import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { assertTransactionDateInOpenYear } from '../../finance/utils/finance.util';
import type { JournalLineInput } from '../../finance/utils/finance.util';
import { NormalBalance } from '../../finance/constants/finance.constants';
import type { TxClient } from '../prisma/prisma-tx.type';

export interface PostVoucherInput {
  companyId: bigint;
  voucherType: string;
  voucherId: bigint;
  voucherNumber: string;
  transactionDate: bigint;
  lines: JournalLineInput[];
  createdBy?: bigint;
}

export interface ReverseVoucherInput {
  companyId: bigint;
  voucherType: string;
  voucherId: bigint;
  reversalVoucherType: string;
  reversalVoucherId: bigint;
  reversalVoucherNumber: string;
  transactionDate: bigint;
  createdBy?: bigint;
  narration?: string;
}

@Injectable()
export class LedgerPostingService {
  async postVoucher(tx: TxClient, input: PostVoucherInput) {
    if (input.lines.length < 2) {
      throw new ApplicationException(
        ErrorCode.VOUCHER_UNBALANCED,
        'Voucher must have at least two ledger lines',
        HttpStatus.BAD_REQUEST,
        { lineCount: input.lines.length },
      );
    }

    await assertTransactionDateInOpenYear(
      tx,
      input.companyId,
      input.transactionDate,
    );

    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);
    const ledgerIds = new Set<string>();

    for (const line of input.lines) {
      const debit = new Prisma.Decimal(line.debitAmount);
      const credit = new Prisma.Decimal(line.creditAmount);

      if (debit.lt(0) || credit.lt(0)) {
        throw new ApplicationException(
          ErrorCode.VOUCHER_UNBALANCED,
          'Debit and credit amounts must be non-negative',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (debit.gt(0) && credit.gt(0)) {
        throw new ApplicationException(
          ErrorCode.VOUCHER_UNBALANCED,
          'A ledger line cannot have both debit and credit amounts',
          HttpStatus.BAD_REQUEST,
          { ledgerId: line.ledgerId.toString() },
        );
      }

      if (debit.eq(0) && credit.eq(0)) {
        throw new ApplicationException(
          ErrorCode.VOUCHER_UNBALANCED,
          'A ledger line must have a debit or credit amount',
          HttpStatus.BAD_REQUEST,
          { ledgerId: line.ledgerId.toString() },
        );
      }

      totalDebit = totalDebit.add(debit);
      totalCredit = totalCredit.add(credit);
      ledgerIds.add(line.ledgerId.toString());
    }

    if (!totalDebit.eq(totalCredit)) {
      throw new ApplicationException(
        ErrorCode.VOUCHER_UNBALANCED,
        'Voucher debits and credits must balance',
        HttpStatus.BAD_REQUEST,
        {
          totalDebit: totalDebit.toString(),
          totalCredit: totalCredit.toString(),
        },
      );
    }

    const ledgers = await tx.ledger.findMany({
      where: {
        id: { in: [...ledgerIds].map((id) => BigInt(id)) },
        deletedAt: null,
      },
      select: { id: true, isActive: true, normalBalance: true },
    });

    if (ledgers.length !== ledgerIds.size) {
      throw new ApplicationException(
        ErrorCode.LEDGER_NOT_FOUND,
        'One or more ledgers were not found for voucher posting',
        HttpStatus.NOT_FOUND,
      );
    }

    for (const ledger of ledgers) {
      if (!ledger.isActive) {
        throw new ApplicationException(
          ErrorCode.LEDGER_INACTIVE,
          `Ledger is inactive: ${ledger.id.toString()}`,
          HttpStatus.CONFLICT,
          { ledgerId: ledger.id.toString() },
        );
      }
    }

    const ledgerMap = new Map(
      ledgers.map((ledger) => [ledger.id.toString(), ledger]),
    );

    const now = BigInt(Date.now());
    const createdEntries: Awaited<
      ReturnType<TxClient['ledgerEntry']['create']>
    >[] = [];

    for (const line of input.lines) {
      const ledger = ledgerMap.get(line.ledgerId.toString());
      if (!ledger) {
        continue;
      }

      const debit = new Prisma.Decimal(line.debitAmount);
      const credit = new Prisma.Decimal(line.creditAmount);
      const runningBalance = await this.computeRunningBalance(
        tx,
        line.ledgerId,
        ledger.normalBalance,
        debit,
        credit,
      );

      const entry = await tx.ledgerEntry.create({
        data: {
          uuid: randomUUID(),
          ledgerId: line.ledgerId,
          voucherType: input.voucherType,
          voucherId: input.voucherId,
          voucherNumber: input.voucherNumber,
          transactionDate: input.transactionDate,
          debitAmount: debit,
          creditAmount: credit,
          runningBalance,
          narration: line.narration,
          isPosted: true,
          createdBy: input.createdBy,
          createdAt: now,
          updatedAt: now,
        },
      });

      createdEntries.push(entry);
    }

    return createdEntries;
  }

  async reverseVoucher(tx: TxClient, input: ReverseVoucherInput) {
    const originalEntries = await tx.ledgerEntry.findMany({
      where: {
        voucherType: input.voucherType,
        voucherId: input.voucherId,
        deletedAt: null,
        isPosted: true,
      },
    });

    if (originalEntries.length === 0) {
      throw new ApplicationException(
        ErrorCode.NOT_FOUND,
        'No posted ledger entries found for voucher reversal',
        HttpStatus.NOT_FOUND,
        {
          voucherType: input.voucherType,
          voucherId: input.voucherId.toString(),
        },
      );
    }

    const reversalLines: JournalLineInput[] = originalEntries.map((entry) => ({
      ledgerId: entry.ledgerId,
      debitAmount: entry.creditAmount,
      creditAmount: entry.debitAmount,
      narration:
        input.narration ??
        `Reversal of ${input.voucherType} ${input.voucherId.toString()}`,
    }));

    return this.postVoucher(tx, {
      companyId: input.companyId,
      voucherType: input.reversalVoucherType,
      voucherId: input.reversalVoucherId,
      voucherNumber: input.reversalVoucherNumber,
      transactionDate: input.transactionDate,
      lines: reversalLines,
      createdBy: input.createdBy,
    });
  }

  private async computeRunningBalance(
    tx: TxClient,
    ledgerId: bigint,
    normalBalance: string,
    debit: Prisma.Decimal,
    credit: Prisma.Decimal,
  ): Promise<Prisma.Decimal> {
    const latestEntry = await tx.ledgerEntry.findFirst({
      where: { ledgerId, deletedAt: null },
      orderBy: [{ transactionDate: 'desc' }, { id: 'desc' }],
      select: { runningBalance: true },
    });

    const previousBalance = new Prisma.Decimal(
      latestEntry?.runningBalance ?? 0,
    );

    if (normalBalance === NormalBalance.DEBIT) {
      return previousBalance.add(debit).sub(credit);
    }

    return previousBalance.add(credit).sub(debit);
  }
}
