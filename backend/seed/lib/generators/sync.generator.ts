import type { PrismaClient } from '@prisma/client';
import { faker, uuid } from '../faker';
import { decimal } from '../id-registry';
import type { SeedContext } from '../seed-context';

export async function seedSync(prisma: PrismaClient, ctx: SeedContext): Promise<void> {
  const deviceId = 'desktop-seed-001';
  let sequenceNo = 1n;

  const entityPool = ctx.entityUuidsForOutbox.length > 0
    ? ctx.entityUuidsForOutbox
    : ctx.batchRecords.map((b) => b.uuid);

  for (let i = 0; i < 100; i++) {
    const entityUuid = faker.helpers.arrayElement(entityPool);
    const branch = faker.helpers.arrayElement(ctx.branchRecords);
    const syncStatus = i % 4 === 0 ? 'PENDING' : 'SYNCED';
    await prisma.outbox.create({
      data: {
        uuid: uuid(),
        entityType: i % 3 === 0 ? 'SalesInvoice' : i % 3 === 1 ? 'Batch' : 'StockMovement',
        entityUuid,
        operation: faker.helpers.arrayElement(['CREATE', 'UPDATE']),
        payload: { seed: true, index: i },
        deviceId,
        branchId: branch.id,
        operationId: `op-${deviceId}-${i + 1}`,
        sequenceNo,
        syncStatus,
        processedAt: syncStatus === 'SYNCED' ? faker.date.recent({ days: 5 }) : undefined,
      },
    });
    sequenceNo++;
  }

  const syncLogIds: bigint[] = [];
  for (let i = 0; i < 5; i++) {
    const startedAt = faker.date.recent({ days: 7 });
    const log = await prisma.syncLog.create({
      data: {
        uuid: uuid(),
        syncType: 'INCREMENTAL',
        syncDirection: 'BIDIRECTIONAL',
        startedAt,
        completedAt: faker.date.between({ from: startedAt, to: new Date() }),
        recordsUploaded: faker.number.int({ min: 10, max: 50 }),
        recordsDownloaded: faker.number.int({ min: 0, max: 20 }),
        conflictsDetected: i === 0 ? 1 : 0,
        status: 'COMPLETED',
        deviceId,
        appVersion: '1.0.0-seed',
      },
    });
    syncLogIds.push(log.id);
  }

  for (let i = 0; i < 3; i++) {
    await prisma.syncConflict.create({
      data: {
        uuid: uuid(),
        syncLogId: syncLogIds[i % syncLogIds.length]!,
        entityType: 'SalesInvoice',
        entityUuid: faker.helpers.arrayElement(entityPool),
        conflictType: 'VERSION_MISMATCH',
        localPayload: { version: 1 },
        serverPayload: { version: 2 },
        resolutionStatus: i === 0 ? 'PENDING' : 'RESOLVED',
        resolvedAt: i === 0 ? undefined : faker.date.recent({ days: 2 }),
      },
    });
  }
}

export async function seedFinancialAndAudit(prisma: PrismaClient, ctx: SeedContext): Promise<void> {
  const userId = ctx.userIds[0];

  const ledger = await prisma.ledger.create({
    data: {
      uuid: uuid(),
      ledgerCode: 'CASH-MAIN',
      ledgerName: 'Main Cash Ledger',
      ledgerType: 'ASSET',
      normalBalance: 'DEBIT',
      isSystem: false,
      isActive: true,
    },
  });

  for (let i = 0; i < 10; i++) {
    const amount = faker.number.int({ min: 100, max: 5000 });
    const isDebit = i % 2 === 0;
    await prisma.ledgerEntry.create({
      data: {
        uuid: uuid(),
        ledgerId: ledger.id,
        voucherType: 'SALES_INVOICE',
        voucherId: BigInt(i + 1),
        voucherNumber: `SI-REF-${i + 1}`,
        transactionDate: faker.date.recent({ days: 30 }),
        debitAmount: decimal(isDebit ? amount : 0),
        creditAmount: decimal(isDebit ? 0 : amount),
        narration: 'Seed ledger entry',
        createdBy: userId,
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    await prisma.payment.create({
      data: {
        uuid: uuid(),
        paymentNumber: `PAY-SEED-${String(i + 1).padStart(4, '0')}`,
        paymentType: 'SUPPLIER_PAYMENT',
        paymentDate: faker.date.recent({ days: 20 }),
        amount: decimal(faker.number.int({ min: 1000, max: 25000 })),
        paymentMethod: 'NEFT',
        status: 'COMPLETED',
        createdBy: userId,
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    await prisma.receipt.create({
      data: {
        uuid: uuid(),
        receiptNumber: `RCP-SEED-${String(i + 1).padStart(4, '0')}`,
        receiptType: 'CUSTOMER_RECEIPT',
        receiptDate: faker.date.recent({ days: 15 }),
        amount: decimal(faker.number.int({ min: 200, max: 8000 })),
        receiptMethod: 'CASH',
        status: 'COMPLETED',
        createdBy: userId,
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    const branch = faker.helpers.arrayElement(ctx.branchRecords);
    await prisma.expense.create({
      data: {
        uuid: uuid(),
        expenseNumber: `EXP-${branch.branchCode}-${i + 1}`,
        branchId: branch.id,
        category: faker.helpers.arrayElement(['RENT', 'UTILITIES', 'STATIONERY']),
        amount: decimal(faker.number.int({ min: 500, max: 15000 })),
        expenseDate: faker.date.recent({ days: 10 }),
        paymentMethod: 'CASH',
        status: 'POSTED',
        createdBy: userId,
      },
    });
  }

  const auditLogs: bigint[] = [];
  for (let i = 0; i < 10; i++) {
    const log = await prisma.auditLog.create({
      data: {
        uuid: uuid(),
        userId,
        action: faker.helpers.arrayElement(['CREATE', 'UPDATE', 'DELETE']),
        entityType: 'SalesInvoice',
        entityUuid: faker.helpers.arrayElement(
          ctx.entityUuidsForOutbox.length ? ctx.entityUuidsForOutbox : [uuid()],
        ),
        module: 'SALES',
        ipAddress: '127.0.0.1',
        deviceId: 'desktop-seed-001',
        actionTimestamp: faker.date.recent({ days: 20 }),
      },
    });
    auditLogs.push(log.id);
  }

  for (let i = 0; i < 5; i++) {
    const medicine = faker.helpers.arrayElement(ctx.medicineRecords);
    await prisma.changeHistory.create({
      data: {
        uuid: uuid(),
        auditLogId: auditLogs[i % auditLogs.length]!,
        entityType: 'Medicine',
        entityId: medicine.id,
        entityUuid: medicine.uuid,
        fieldName: 'medicineName',
        oldValue: medicine.uuid,
        newValue: `${medicine.uuid}-updated`,
        changeType: 'UPDATE',
      },
    });
  }

  const loyaltyProgram = await prisma.loyaltyProgram.create({
    data: {
      uuid: uuid(),
      programCode: 'APEX-REWARDS',
      programName: 'Apex Rewards',
      pointsPerAmount: decimal(1),
      redemptionValue: decimal(0.25),
      minimumRedemptionPoints: 100,
      effectiveFrom: new Date('2024-04-01'),
      isDefault: true,
      isActive: true,
    },
  });

  for (let i = 0; i < 5; i++) {
    await prisma.loyaltyTransaction.create({
      data: {
        uuid: uuid(),
        loyaltyProgramId: loyaltyProgram.id,
        customerId: faker.helpers.arrayElement(ctx.customerIds),
        transactionNumber: `LT-SEED-${String(i + 1).padStart(4, '0')}`,
        transactionType: 'EARN',
        transactionDate: faker.date.recent({ days: 20 }),
        points: faker.number.int({ min: 10, max: 200 }),
        remarks: 'Seed loyalty earn',
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    const doctorId = faker.helpers.arrayElement(ctx.doctorIds);
    const customerId = faker.helpers.arrayElement(ctx.customerIds);
    const branch = faker.helpers.arrayElement(ctx.branchRecords);
    const medicine = faker.helpers.arrayElement(ctx.medicineRecords);
    const qty = faker.number.int({ min: 10, max: 30 });

    const prescription = await prisma.prescription.create({
      data: {
        uuid: uuid(),
        prescriptionNumber: `RX-${branch.branchCode}-${String(i + 1).padStart(4, '0')}`,
        doctorId,
        customerId,
        branchId: branch.id,
        prescriptionDate: faker.date.recent({ days: 7 }),
        status: 'ACTIVE',
      },
    });

    await prisma.prescriptionItem.create({
      data: {
        uuid: uuid(),
        prescriptionId: prescription.id,
        medicineId: medicine.id,
        unitId: medicine.unitId,
        lineNumber: 1,
        prescribedQuantity: decimal(qty),
        remainingQuantity: decimal(qty),
        dosage: '1-0-1',
        frequency: 'Twice daily',
        instructions: 'After food',
        status: 'ACTIVE',
      },
    });
  }
}
