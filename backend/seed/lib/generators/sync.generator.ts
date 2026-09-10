import type { PrismaClient } from '@prisma/client';
import { faker, uuid } from '../faker';
import { decimal, docNumber } from '../id-registry';
import type { SeedContext } from '../seed-context';

export async function seedSync(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  const deviceId = 'desktop-seed-001';
  const existingOutboxCount = await prisma.outbox.count();
  const maxSequenceRow = await prisma.outbox.aggregate({
    _max: { sequenceNo: true },
  });
  let sequenceNo = (maxSequenceRow._max.sequenceNo ?? 0n) + 1n;

  const entityPool =
    ctx.entityUuidsForOutbox.length > 0
      ? ctx.entityUuidsForOutbox
      : ctx.batchRecords.map((b) => b.uuid);

  for (let i = 0; i < 100; i++) {
    const entityUuid = faker.helpers.arrayElement(entityPool);
    const branch = faker.helpers.arrayElement(ctx.branchRecords);
    const syncStatus = i % 4 === 0 ? 'PENDING' : 'SYNCED';
    await prisma.outbox.create({
      data: {
        uuid: uuid(),
        entityType:
          i % 3 === 0
            ? 'SalesInvoice'
            : i % 3 === 1
              ? 'Batch'
              : 'StockMovement',
        entityUuid,
        operation: faker.helpers.arrayElement(['CREATE', 'UPDATE']),
        payload: { seed: true, index: existingOutboxCount + i },
        deviceId,
        branchId: branch.id,
        operationId: `op-${deviceId}-${existingOutboxCount + i + 1}`,
        sequenceNo,
        syncStatus,
        processedAt:
          syncStatus === 'SYNCED'
            ? BigInt(faker.date.recent({ days: 5 }).getTime())
            : undefined,
        createdAt: BigInt(Date.now()),
      },
    });
    sequenceNo++;
  }

  const syncLogIds: bigint[] = [];
  for (let i = 0; i < 5; i++) {
    const startedAt = BigInt(faker.date.recent({ days: 7 }).getTime());
    const log = await prisma.syncLog.create({
      data: {
        uuid: uuid(),
        syncType: 'INCREMENTAL',
        syncDirection: 'BIDIRECTIONAL',
        startedAt,
        completedAt: BigInt(
          faker.date
            .between({ from: Number(startedAt), to: new Date() })
            .getTime(),
        ),
        recordsUploaded: faker.number.int({ min: 10, max: 50 }),
        recordsDownloaded: faker.number.int({ min: 0, max: 20 }),
        conflictsDetected: i === 0 ? 1 : 0,
        status: 'COMPLETED',
        deviceId,
        appVersion: '1.0.0-seed',
        createdAt: BigInt(Date.now()),
      },
    });
    syncLogIds.push(log.id);
  }

  for (let i = 0; i < 3; i++) {
    await prisma.syncConflict.create({
      data: {
        uuid: uuid(),
        syncLogId: syncLogIds[i % syncLogIds.length],
        entityType: 'SalesInvoice',
        entityUuid: faker.helpers.arrayElement(entityPool),
        conflictType: 'VERSION_MISMATCH',
        localPayload: { version: 1 },
        serverPayload: { version: 2 },
        resolutionStatus: i === 0 ? 'PENDING' : 'RESOLVED',
        resolvedAt:
          i === 0
            ? undefined
            : BigInt(faker.date.recent({ days: 2 }).getTime()),
        createdAt: BigInt(Date.now()),
      },
    });
  }
}

export async function seedFinancialAndAudit(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  const userId = ctx.userIds[0];
  const paymentOffset = await prisma.payment.count();
  const receiptOffset = await prisma.receipt.count();
  const loyaltyTxnOffset = await prisma.loyaltyTransaction.count();
  const ledgerEntryOffset = await prisma.ledgerEntry.count();

  let ledger = await prisma.ledger.findUnique({
    where: { ledgerCode: 'CASH001' },
  });
  if (!ledger) {
    ledger = await prisma.ledger.create({
      data: {
        uuid: uuid(),
        ledgerCode: 'CASH001',
        ledgerName: 'Cash in Hand',
        ledgerType: 'ASSET',
        normalBalance: 'DEBIT',
        isSystem: true,
        isActive: true,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  for (let i = 0; i < 10; i++) {
    const amount = faker.number.int({ min: 100, max: 5000 });
    const isDebit = i % 2 === 0;
    await prisma.ledgerEntry.create({
      data: {
        uuid: uuid(),
        ledgerId: ledger.id,
        voucherType: 'SALES_INVOICE',
        voucherId: BigInt(ledgerEntryOffset + i + 1),
        voucherNumber: `SI-REF-${ledgerEntryOffset + i + 1}`,
        transactionDate: BigInt(faker.date.recent({ days: 30 }).getTime()),
        debitAmount: decimal(isDebit ? amount : 0),
        creditAmount: decimal(isDebit ? 0 : amount),
        narration: 'Seed ledger entry',
        createdBy: userId,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    await prisma.payment.create({
      data: {
        uuid: uuid(),
        paymentNumber: `PAY-SEED-${String(paymentOffset + i + 1).padStart(4, '0')}`,
        paymentType: 'SUPPLIER_PAYMENT',
        paymentDate: BigInt(faker.date.recent({ days: 20 }).getTime()),
        amount: decimal(faker.number.int({ min: 1000, max: 25000 })),
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        createdBy: userId,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    await prisma.receipt.create({
      data: {
        uuid: uuid(),
        receiptNumber: `RCP-SEED-${String(receiptOffset + i + 1).padStart(4, '0')}`,
        receiptType: 'CUSTOMER_PAYMENT',
        receiptDate: BigInt(faker.date.recent({ days: 15 }).getTime()),
        amount: decimal(faker.number.int({ min: 200, max: 8000 })),
        receiptMethod: 'CASH',
        status: 'PENDING',
        createdBy: userId,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    const branch = faker.helpers.arrayElement(ctx.branchRecords);
    const expenseSeq = ctx.nextExpenseSeq(branch.branchCode);
    await prisma.expense.create({
      data: {
        uuid: uuid(),
        expenseNumber: docNumber('EXP', branch.branchCode, expenseSeq, 4),
        branchId: branch.id,
        category: faker.helpers.arrayElement([
          'RENT',
          'UTILITIES',
          'STATIONERY',
        ]),
        amount: decimal(faker.number.int({ min: 500, max: 15000 })),
        expenseDate: BigInt(faker.date.recent({ days: 10 }).getTime()),
        paymentMethod: 'CASH',
        status: 'POSTED',
        createdBy: userId,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
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
        actionTimestamp: BigInt(faker.date.recent({ days: 20 }).getTime()),
        createdAt: BigInt(Date.now()),
      },
    });
    auditLogs.push(log.id);
  }

  for (let i = 0; i < 5; i++) {
    const medicine = faker.helpers.arrayElement(ctx.medicineRecords);
    await prisma.changeHistory.create({
      data: {
        uuid: uuid(),
        auditLogId: auditLogs[i % auditLogs.length],
        entityType: 'Medicine',
        entityId: medicine.id,
        entityUuid: medicine.uuid,
        fieldName: 'medicineName',
        oldValue: medicine.uuid,
        newValue: `${medicine.uuid}-updated`,
        changeType: 'UPDATE',
        changedAt: BigInt(new Date().getTime()),
      },
    });
  }

  let loyaltyProgram = await prisma.loyaltyProgram.findUnique({
    where: { programCode: 'APEX-REWARDS' },
  });
  if (!loyaltyProgram) {
    loyaltyProgram = await prisma.loyaltyProgram.create({
      data: {
        uuid: uuid(),
        programCode: 'APEX-REWARDS',
        programName: 'Apex Rewards',
        pointsPerAmount: decimal(1),
        redemptionValue: decimal(0.25),
        minimumRedemptionPoints: 100,
        effectiveFrom: BigInt(new Date('2024-04-01').getTime()),
        isDefault: true,
        isActive: true,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    await prisma.loyaltyTransaction.create({
      data: {
        uuid: uuid(),
        loyaltyProgramId: loyaltyProgram.id,
        customerId: faker.helpers.arrayElement(ctx.customerIds),
        transactionNumber: `LT-SEED-${String(loyaltyTxnOffset + i + 1).padStart(4, '0')}`,
        transactionType: 'EARN',
        transactionDate: BigInt(faker.date.recent({ days: 20 }).getTime()),
        points: faker.number.int({ min: 10, max: 200 }),
        remarks: 'Seed loyalty earn',
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    const doctorId = faker.helpers.arrayElement(ctx.doctorIds);
    const customerId = faker.helpers.arrayElement(ctx.customerIds);
    const branch = faker.helpers.arrayElement(ctx.branchRecords);
    const medicine = faker.helpers.arrayElement(ctx.medicineRecords);
    const qty = faker.number.int({ min: 10, max: 30 });
    const rxSeq = ctx.nextPrescriptionSeq(branch.branchCode);

    const prescription = await prisma.prescription.create({
      data: {
        uuid: uuid(),
        prescriptionNumber: `RX-${branch.branchCode}-${String(rxSeq).padStart(4, '0')}`,
        doctorId,
        customerId,
        branchId: branch.id,
        prescriptionDate: BigInt(faker.date.recent({ days: 7 }).getTime()),
        status: 'ACTIVE',
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
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
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      },
    });
  }
}
