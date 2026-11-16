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
  txCustomerLookup,
  txLoyaltyProgramLookup,
  txSalesInvoiceLookup,
} from '../sync-fk-resolve.util';
import {
  applyConflictFirst,
  applyServerWin,
  asDecimal,
  asInt,
} from './transactional-apply-shared';

export async function applyLoyaltyTransactional(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  switch (record.entityType) {
    case OutboxEntityType.LOYALTY_PROGRAM:
      await applyLoyaltyProgram(tx, record);
      return;
    case OutboxEntityType.LOYALTY_TRANSACTION:
      await applyLoyaltyTransaction(tx, record);
      return;
    case OutboxEntityType.CUSTOMER_LOYALTY_MEMBERSHIP:
      await applyCustomerLoyaltyMembership(tx, record);
      return;
    default:
      throw new SyncApplyError(
        `Loyalty apply does not handle ${record.entityType}`,
      );
  }
}

async function applyLoyaltyProgram(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyServerWin(
    tx,
    record,
    async (uuid) => {
      const row = await tx.loyaltyProgram.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      return {
        uuid,
        programCode: asString(base.programCode, 'programCode'),
        programName: asString(base.programName, 'programName'),
        description: asOptionalString(base.description),
        pointsPerAmount: asDecimal(base.pointsPerAmount),
        redemptionValue: asDecimal(base.redemptionValue),
        minimumRedemptionPoints: asInt(
          base.minimumRedemptionPoints,
          'minimumRedemptionPoints',
        ),
        maximumRedemptionPoints: base.maximumRedemptionPoints
          ? asInt(base.maximumRedemptionPoints, 'maximumRedemptionPoints')
          : null,
        effectiveFrom: asBigInt(base.effectiveFrom, 'effectiveFrom'),
        effectiveTo: base.effectiveTo
          ? asBigInt(base.effectiveTo, 'effectiveTo')
          : null,
        isDefault: asBool(base.isDefault, false),
        isActive: asBool(base.isActive, true),
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    (data, serverVersion) => {
      const base = stripIncomingSyncData(data);
      return {
        isActive: asBool(base.isActive, true),
        version: serverVersion,
        updatedAt: BigInt(Date.now()),
      };
    },
    (row) => tx.loyaltyProgram.create({ data: row as never }),
    (id, row) =>
      tx.loyaltyProgram.update({ where: { id }, data: row as never }),
  );
}

async function applyLoyaltyTransaction(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyConflictFirst(
    tx,
    record,
    async (uuid) => {
      const row = await tx.loyaltyTransaction.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const loyaltyProgramId = await resolveIdField(
        txLoyaltyProgramLookup(tx),
        base,
        'loyaltyProgramId',
        'loyaltyProgramUuid',
        'loyaltyProgram',
        true,
      );
      const customerId = await resolveIdField(
        txCustomerLookup(tx),
        base,
        'customerId',
        'customerUuid',
        'customer',
        true,
      );
      const salesInvoiceId = await resolveOptionalIdField(
        txSalesInvoiceLookup(tx),
        base,
        'salesInvoiceId',
        'salesInvoiceUuid',
        'salesInvoice',
      );
      return {
        uuid,
        loyaltyProgramId: loyaltyProgramId!,
        customerId: customerId!,
        salesInvoiceId,
        transactionNumber: asString(
          base.transactionNumber,
          'transactionNumber',
        ),
        transactionType: asString(base.transactionType, 'transactionType'),
        transactionDate: asBigInt(base.transactionDate, 'transactionDate'),
        points: asInt(base.points, 'points'),
        monetaryValue: base.monetaryValue
          ? asDecimal(base.monetaryValue)
          : null,
        balanceAfterTransaction: base.balanceAfterTransaction
          ? asInt(base.balanceAfterTransaction, 'balanceAfterTransaction')
          : null,
        remarks: asOptionalString(base.remarks),
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
    (row) => tx.loyaltyTransaction.create({ data: row as never }),
    (id, row) =>
      tx.loyaltyTransaction.update({ where: { id }, data: row as never }),
  );
}

async function applyCustomerLoyaltyMembership(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyServerWin(
    tx,
    record,
    async (uuid) => {
      const row = await tx.customerLoyaltyMembership.findFirst({
        where: { uuid },
      });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const customerId = await resolveIdField(
        txCustomerLookup(tx),
        base,
        'customerId',
        'customerUuid',
        'customer',
        true,
      );
      const loyaltyProgramId = await resolveIdField(
        txLoyaltyProgramLookup(tx),
        base,
        'loyaltyProgramId',
        'loyaltyProgramUuid',
        'loyaltyProgram',
        true,
      );
      return {
        uuid,
        customerId: customerId!,
        loyaltyProgramId: loyaltyProgramId!,
        status: asString(base.status ?? 'ACTIVE', 'status'),
        enrolledAt: asBigInt(base.enrolledAt, 'enrolledAt'),
        endedAt: base.endedAt ? asBigInt(base.endedAt, 'endedAt') : null,
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
    (row) => tx.customerLoyaltyMembership.create({ data: row as never }),
    (id, row) =>
      tx.customerLoyaltyMembership.update({
        where: { id },
        data: row as never,
      }),
  );
}
