import { OutboxEntityType } from '../../../persistence/outbox/entity-type.constants';
import type { TxClient } from '../../../persistence/prisma/prisma-tx.type';
import type { SyncCloudPullRecord } from '../../cloud/sync-cloud.contract';
import {
  asBigInt,
  asBool,
  asOptionalString,
  asString,
  SyncApplyError,
} from '../sync-apply.util';
import {
  resolveIdField,
  resolveOptionalIdField,
  stripIncomingSyncData,
  txLedgerLookup,
} from '../sync-fk-resolve.util';
import { applyConflictFirst, asDecimal } from './transactional-apply-shared';

export async function applyFinanceTransactional(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  switch (record.entityType) {
    case OutboxEntityType.LEDGER:
      await applyLedger(tx, record);
      return;
    case OutboxEntityType.LEDGER_ENTRY:
      await applyLedgerEntry(tx, record);
      return;
    case OutboxEntityType.PAYMENT:
      await applyPayment(tx, record);
      return;
    case OutboxEntityType.RECEIPT:
      await applyReceipt(tx, record);
      return;
    default:
      throw new SyncApplyError(
        `Finance apply does not handle ${record.entityType}`,
      );
  }
}

async function applyLedger(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyConflictFirst(
    tx,
    record,
    async (uuid) => {
      const row = await tx.ledger.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const parentLedgerId = await resolveOptionalIdField(
        txLedgerLookup(tx),
        base,
        'parentLedgerId',
        'parentLedgerUuid',
        'parentLedger',
      );
      return {
        uuid,
        ledgerCode: asString(base.ledgerCode, 'ledgerCode'),
        ledgerName: asString(base.ledgerName, 'ledgerName'),
        ledgerType: asString(base.ledgerType, 'ledgerType'),
        parentLedgerId,
        normalBalance: asString(base.normalBalance, 'normalBalance'),
        isSystem: asBool(base.isSystem, false),
        isActive: asBool(base.isActive, true),
        description: asOptionalString(base.description),
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    (data, serverVersion) => ({
      isActive: asBool(stripIncomingSyncData(data).isActive, true),
      version: serverVersion,
      updatedAt: BigInt(Date.now()),
    }),
    (row) => tx.ledger.create({ data: row as never }),
    (id, row) => tx.ledger.update({ where: { id }, data: row as never }),
  );
}

async function applyLedgerEntry(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyConflictFirst(
    tx,
    record,
    async (uuid) => {
      const row = await tx.ledgerEntry.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const ledgerId = await resolveIdField(
        txLedgerLookup(tx),
        base,
        'ledgerId',
        'ledgerUuid',
        'ledger',
        true,
      );
      return {
        uuid,
        ledgerId: ledgerId!,
        voucherType: asString(base.voucherType, 'voucherType'),
        voucherId: asBigInt(base.voucherId, 'voucherId'),
        voucherNumber: asString(base.voucherNumber, 'voucherNumber'),
        transactionDate: asBigInt(base.transactionDate, 'transactionDate'),
        debitAmount: asDecimal(base.debitAmount ?? '0'),
        creditAmount: asDecimal(base.creditAmount ?? '0'),
        runningBalance: base.runningBalance
          ? asDecimal(base.runningBalance)
          : null,
        narration: asOptionalString(base.narration),
        isPosted: asBool(base.isPosted, true),
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    (data, serverVersion) => ({
      isPosted: asBool(stripIncomingSyncData(data).isPosted, true),
      version: serverVersion,
      updatedAt: BigInt(Date.now()),
    }),
    (row) => tx.ledgerEntry.create({ data: row as never }),
    (id, row) => tx.ledgerEntry.update({ where: { id }, data: row as never }),
  );
}

async function applyPayment(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyConflictFirst(
    tx,
    record,
    async (uuid) => {
      const row = await tx.payment.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      return {
        uuid,
        paymentNumber: asString(base.paymentNumber, 'paymentNumber'),
        paymentType: asString(base.paymentType, 'paymentType'),
        paymentDate: asBigInt(base.paymentDate, 'paymentDate'),
        amount: asDecimal(base.amount),
        paymentMethod: asString(base.paymentMethod, 'paymentMethod'),
        transactionReference: asOptionalString(base.transactionReference),
        referenceType: asOptionalString(base.referenceType),
        referenceId: base.referenceId
          ? asBigInt(base.referenceId, 'referenceId')
          : null,
        status: asString(base.status, 'status'),
        remarks: asOptionalString(base.remarks),
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    (data, serverVersion) => ({
      status: asString(stripIncomingSyncData(data).status, 'status'),
      version: serverVersion,
      updatedAt: BigInt(Date.now()),
    }),
    (row) => tx.payment.create({ data: row as never }),
    (id, row) => tx.payment.update({ where: { id }, data: row as never }),
  );
}

async function applyReceipt(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyConflictFirst(
    tx,
    record,
    async (uuid) => {
      const row = await tx.receipt.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      return {
        uuid,
        receiptNumber: asString(base.receiptNumber, 'receiptNumber'),
        receiptType: asString(base.receiptType, 'receiptType'),
        receiptDate: asBigInt(base.receiptDate, 'receiptDate'),
        amount: asDecimal(base.amount),
        receiptMethod: asString(base.receiptMethod, 'receiptMethod'),
        transactionReference: asOptionalString(base.transactionReference),
        referenceType: asOptionalString(base.referenceType),
        referenceId: base.referenceId
          ? asBigInt(base.referenceId, 'referenceId')
          : null,
        status: asString(base.status, 'status'),
        remarks: asOptionalString(base.remarks),
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    (data, serverVersion) => ({
      status: asString(stripIncomingSyncData(data).status, 'status'),
      version: serverVersion,
      updatedAt: BigInt(Date.now()),
    }),
    (row) => tx.receipt.create({ data: row as never }),
    (id, row) => tx.receipt.update({ where: { id }, data: row as never }),
  );
}
