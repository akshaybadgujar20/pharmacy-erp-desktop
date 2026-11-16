import { OutboxEntityType } from '../../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../../persistence/outbox/outbox-operation.constants';
import type { TxClient } from '../../../persistence/prisma/prisma-tx.type';
import type { SyncCloudPullRecord } from '../../cloud/sync-cloud.contract';
import {
  asBigInt,
  asBool,
  asOptionalString,
  asString,
  extractApplyData,
  recordEntityUuid,
  serverVersionFromRecord,
  SyncApplyConflictError,
  SyncApplyError,
} from '../sync-apply.util';
import {
  resolveIdField,
  resolveOptionalIdField,
  stripIncomingSyncData,
  txBatchLookup,
  txBranchLookup,
  txEmployeeLookup,
  txMedicineLookup,
} from '../sync-fk-resolve.util';
import {
  applyConflictFirst,
  applyServerWin,
  assertServerWins,
  asDecimal,
} from './transactional-apply-shared';

export async function applyInventoryTransactional(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  switch (record.entityType) {
    case OutboxEntityType.BATCH:
      await applyBatch(tx, record);
      return;
    case OutboxEntityType.STOCK:
      await applyStock(tx, record);
      return;
    case OutboxEntityType.STOCK_MOVEMENT:
      await applyStockMovement(tx, record);
      return;
    case OutboxEntityType.STOCK_ADJUSTMENT:
      await applyStockAdjustment(tx, record);
      return;
    case OutboxEntityType.STOCK_TRANSFER:
      await applyStockTransfer(tx, record);
      return;
    case OutboxEntityType.STOCK_TAKE:
      await applyStockTake(tx, record);
      return;
    default:
      throw new SyncApplyError(
        `Inventory apply does not handle ${record.entityType}`,
      );
  }
}

async function applyBatch(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyServerWin(
    tx,
    record,
    async (uuid) => {
      const row = await tx.batch.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const medicineId = await resolveIdField(
        txMedicineLookup(tx),
        base,
        'medicineId',
        'medicineUuid',
        'medicine',
        true,
      );
      return {
        uuid,
        medicineId: medicineId!,
        batchNumber: asString(base.batchNumber, 'batchNumber'),
        manufacturingDate: base.manufacturingDate
          ? asBigInt(base.manufacturingDate, 'manufacturingDate')
          : null,
        expiryDate: asBigInt(base.expiryDate, 'expiryDate'),
        purchaseRate: asDecimal(base.purchaseRate),
        mrp: asDecimal(base.mrp),
        barcode: asOptionalString(base.barcode),
        isActive: asBool(base.isActive, true),
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    (data, serverVersion) => {
      const base = stripIncomingSyncData(data);
      return {
        purchaseRate: asDecimal(base.purchaseRate),
        mrp: asDecimal(base.mrp),
        isActive: asBool(base.isActive, true),
        version: serverVersion,
        updatedAt: BigInt(Date.now()),
      };
    },
    (row) => tx.batch.create({ data: row as never }),
    (id, row) => tx.batch.update({ where: { id }, data: row as never }),
  );
}

async function applyStock(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const existing = await tx.stock.findFirst({ where: { uuid } });

  const serverQty = data.availableQuantity;
  if (existing && serverQty != null) {
    const localQty = existing.availableQuantity.toString();
    const remoteQty =
      typeof serverQty === 'string' || typeof serverQty === 'number'
        ? String(serverQty)
        : null;
    if (remoteQty != null && localQty !== remoteQty) {
      if (existing.version >= serverVersion) {
        throw new SyncApplyConflictError(
          'Stock quantity mismatch; local ledger takes precedence',
        );
      }
    }
  }

  if (record.operation === OutboxOperation.DELETE) {
    return;
  }

  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.stock.update({
      where: { id: existing.id },
      data: {
        availableQuantity: asDecimal(
          data.availableQuantity ?? existing.availableQuantity,
        ),
        reservedQuantity: asDecimal(
          data.reservedQuantity ?? existing.reservedQuantity,
        ),
        inTransitQuantity: asDecimal(
          data.inTransitQuantity ?? existing.inTransitQuantity,
        ),
        version: serverVersion,
        updatedAt: BigInt(Date.now()),
      },
    });
    return;
  }

  const branchId = await resolveIdField(
    txBranchLookup(tx),
    data,
    'branchId',
    'branchUuid',
    'branch',
    true,
  );
  const batchId = await resolveIdField(
    txBatchLookup(tx),
    data,
    'batchId',
    'batchUuid',
    'batch',
    true,
  );

  await tx.stock.create({
    data: {
      uuid,
      branchId: branchId!,
      batchId: batchId!,
      availableQuantity: asDecimal(data.availableQuantity ?? '0'),
      reservedQuantity: asDecimal(data.reservedQuantity ?? '0'),
      damagedQuantity: asDecimal(data.damagedQuantity ?? '0'),
      expiredQuantity: asDecimal(data.expiredQuantity ?? '0'),
      inTransitQuantity: asDecimal(data.inTransitQuantity ?? '0'),
      isActive: asBool(data.isActive, true),
      version: serverVersion,
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
    },
  });
}

async function applyStockMovement(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyConflictFirst(
    tx,
    record,
    async (uuid) => {
      const row = await tx.stockMovement.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: 1n } : null;
    },
    async (data, uuid) => {
      const base = stripIncomingSyncData(data);
      const branchId = await resolveIdField(
        txBranchLookup(tx),
        base,
        'branchId',
        'branchUuid',
        'branch',
        true,
      );
      const medicineId = await resolveIdField(
        txMedicineLookup(tx),
        base,
        'medicineId',
        'medicineUuid',
        'medicine',
        true,
      );
      const batchId = await resolveIdField(
        txBatchLookup(tx),
        base,
        'batchId',
        'batchUuid',
        'batch',
        true,
      );
      return {
        uuid,
        movementNumber: asString(base.movementNumber, 'movementNumber'),
        branchId: branchId!,
        medicineId: medicineId!,
        batchId: batchId!,
        movementType: asString(base.movementType, 'movementType'),
        movementDirection: asString(
          base.movementDirection,
          'movementDirection',
        ),
        quantity: asDecimal(base.quantity),
        unitCost: asDecimal(base.unitCost),
        balanceAfter: asDecimal(base.balanceAfter),
        referenceTable: asString(base.referenceTable, 'referenceTable'),
        referenceId: asBigInt(base.referenceId, 'referenceId'),
        movementDate: asBigInt(base.movementDate, 'movementDate'),
        remarks: asOptionalString(base.remarks),
        createdAt: BigInt(Date.now()),
      };
    },
    () => ({}),
    (row) => tx.stockMovement.create({ data: row as never }),
    async () => Promise.resolve(undefined),
  );
}

async function applyStockAdjustment(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyConflictFirst(
    tx,
    record,
    async (uuid) => {
      const row = await tx.stockAdjustment.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const branchId = await resolveIdField(
        txBranchLookup(tx),
        base,
        'branchId',
        'branchUuid',
        'branch',
        true,
      );
      const approvedByEmployeeId = await resolveOptionalIdField(
        txEmployeeLookup(tx),
        base,
        'approvedByEmployeeId',
        'approvedByEmployeeUuid',
        'employee',
      );
      return {
        uuid,
        adjustmentNumber: asString(base.adjustmentNumber, 'adjustmentNumber'),
        branchId: branchId!,
        adjustmentType: asString(base.adjustmentType, 'adjustmentType'),
        adjustmentDate: asBigInt(base.adjustmentDate, 'adjustmentDate'),
        reason: asString(base.reason, 'reason'),
        approvedByEmployeeId,
        approvedAt: base.approvedAt
          ? asBigInt(base.approvedAt, 'approvedAt')
          : null,
        status: asString(base.status, 'status'),
        isActive: asBool(base.isActive, true),
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
    (row) => tx.stockAdjustment.create({ data: row as never }),
    (id, row) =>
      tx.stockAdjustment.update({ where: { id }, data: row as never }),
  );
}

async function applyStockTransfer(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyConflictFirst(
    tx,
    record,
    async (uuid) => {
      const row = await tx.stockTransfer.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const sourceBranchId = await resolveIdField(
        txBranchLookup(tx),
        base,
        'sourceBranchId',
        'sourceBranchUuid',
        'sourceBranch',
        true,
      );
      const destinationBranchId = await resolveIdField(
        txBranchLookup(tx),
        base,
        'destinationBranchId',
        'destinationBranchUuid',
        'destinationBranch',
        true,
      );
      return {
        uuid,
        transferNumber: asString(base.transferNumber, 'transferNumber'),
        sourceBranchId: sourceBranchId!,
        destinationBranchId: destinationBranchId!,
        transferDate: asBigInt(base.transferDate, 'transferDate'),
        expectedArrivalDate: base.expectedArrivalDate
          ? asBigInt(base.expectedArrivalDate, 'expectedArrivalDate')
          : null,
        status: asString(base.status ?? 'DRAFT', 'status'),
        transferType: asString(
          base.transferType ?? 'ROUTINE_REPLENISHMENT',
          'transferType',
        ),
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
    (row) => tx.stockTransfer.create({ data: row as never }),
    (id, row) => tx.stockTransfer.update({ where: { id }, data: row as never }),
  );
}

async function applyStockTake(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyConflictFirst(
    tx,
    record,
    async (uuid) => {
      const row = await tx.stockTake.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const branchId = await resolveIdField(
        txBranchLookup(tx),
        base,
        'branchId',
        'branchUuid',
        'branch',
        true,
      );
      const countedByEmployeeId = await resolveIdField(
        txEmployeeLookup(tx),
        base,
        'countedByEmployeeId',
        'countedByEmployeeUuid',
        'employee',
        true,
      );
      const approvedByEmployeeId = await resolveOptionalIdField(
        txEmployeeLookup(tx),
        base,
        'approvedByEmployeeId',
        'approvedByEmployeeUuid',
        'employee',
      );
      return {
        uuid,
        stockTakeNumber: asString(base.stockTakeNumber, 'stockTakeNumber'),
        branchId: branchId!,
        stockTakeDate: asBigInt(base.stockTakeDate, 'stockTakeDate'),
        countType: asString(base.countType ?? 'CYCLE_COUNT', 'countType'),
        status: asString(base.status ?? 'DRAFT', 'status'),
        countedByEmployeeId: countedByEmployeeId!,
        approvedByEmployeeId,
        approvedAt: base.approvedAt
          ? asBigInt(base.approvedAt, 'approvedAt')
          : null,
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
    (row) => tx.stockTake.create({ data: row as never }),
    (id, row) => tx.stockTake.update({ where: { id }, data: row as never }),
  );
}
