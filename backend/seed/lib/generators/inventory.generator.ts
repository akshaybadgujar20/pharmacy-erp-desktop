import type { PrismaClient } from '@prisma/client';
import { faker, uuid } from '../faker';
import { decimal, docNumber } from '../id-registry';
import type { SeedContext } from '../seed-context';

async function recordMovement(
  prisma: PrismaClient,
  ctx: SeedContext,
  params: {
    branchId: bigint;
    branchCode: string;
    medicineId: bigint;
    batchId: bigint;
    movementType: string;
    direction: 'IN' | 'OUT';
    quantity: number;
    unitCost: string;
    referenceTable: string;
    referenceId: bigint;
    createdBy?: bigint;
  },
): Promise<void> {
  const key = ctx.stockKey(params.branchId, params.batchId);
  const current = ctx.getStock(params.branchId, params.batchId);
  const delta = params.direction === 'IN' ? params.quantity : -params.quantity;
  const balance = current + delta;
  if (balance < 0) throw new Error(`Negative stock for batch ${params.batchId} at branch ${params.branchId}`);
  ctx.setStock(params.branchId, params.batchId, balance);

  const existingStock = await prisma.stock.findFirst({
    where: { branchId: params.branchId, batchId: params.batchId },
  });
  if (!existingStock && params.direction === 'IN') {
    await prisma.stock.create({
      data: {
        uuid: uuid(),
        branchId: params.branchId,
        batchId: params.batchId,
        availableQuantity: decimal(balance),
        lastMovementAt: new Date(),
        isActive: true,
      },
    });
  } else {
    await prisma.stock.updateMany({
      where: { branchId: params.branchId, batchId: params.batchId },
      data: { availableQuantity: decimal(balance), lastMovementAt: new Date() },
    });
  }

  const seq = ctx.nextMovementSeq(params.branchCode);
  await prisma.stockMovement.create({
    data: {
      uuid: uuid(),
      movementNumber: docNumber('SM', params.branchCode, seq),
      branchId: params.branchId,
      medicineId: params.medicineId,
      batchId: params.batchId,
      movementType: params.movementType,
      movementDirection: params.direction,
      quantity: decimal(params.quantity),
      unitCost: params.unitCost,
      balanceAfter: decimal(balance),
      referenceTable: params.referenceTable,
      referenceId: params.referenceId,
      movementDate: faker.date.recent({ days: 60 }),
      createdBy: params.createdBy,
    },
  });
}

export async function seedInventory(prisma: PrismaClient, ctx: SeedContext): Promise<void> {
  const userId = ctx.userIds[0];

  for (const batch of ctx.batchRecords) {
    const branchCount = faker.number.int({ min: 2, max: 4 });
    const branches = faker.helpers.arrayElements(ctx.branchRecords, branchCount);
    for (const branch of branches) {
      const qty = faker.number.int({ min: 20, max: 200 });
      const stockUuid = uuid();
      await prisma.stock.create({
        data: {
          uuid: stockUuid,
          batchId: batch.id,
          branchId: branch.id,
          availableQuantity: decimal(qty),
          isActive: true,
        },
      });
      ctx.setStock(branch.id, batch.id, qty);

      const seq = ctx.nextMovementSeq(branch.branchCode);
      await prisma.stockMovement.create({
        data: {
          uuid: uuid(),
          movementNumber: docNumber('SM', branch.branchCode, seq),
          branchId: branch.id,
          medicineId: batch.medicineId,
          batchId: batch.id,
          movementType: 'PURCHASE_GRN',
          movementDirection: 'IN',
          quantity: decimal(qty),
          unitCost: batch.purchaseRate,
          balanceAfter: decimal(qty),
          referenceTable: 'seed_initial',
          referenceId: batch.id,
          movementDate: faker.date.past({ days: 90 }),
          createdBy: userId,
        },
      });
    }
  }

  const stockEntries = [...ctx.stockBalances.entries()].filter(([, qty]) => qty > 5);
  let movementTarget = 100;
  const existingMovements = await prisma.stockMovement.count();
  movementTarget = Math.max(0, movementTarget - existingMovements);

  for (let i = 0; i < movementTarget; i++) {
    const [key, qty] = faker.helpers.arrayElement(stockEntries);
    const [branchIdStr, batchIdStr] = key.split(':');
    const branchId = BigInt(branchIdStr!);
    const batchId = BigInt(batchIdStr!);
    const batch = ctx.batchRecords.find((b) => b.id === batchId);
    const branch = ctx.branchRecords.find((b) => b.id === branchId);
    if (!batch || !branch) continue;

    const isOut = faker.number.float() < 0.55 && qty > 10;
    const moveQty = faker.number.int({ min: 1, max: Math.min(10, isOut ? qty - 1 : 50) });
    const type = isOut
      ? faker.helpers.arrayElement(['SALES_INVOICE', 'ADJUSTMENT_LOSS'])
      : faker.helpers.arrayElement(['ADJUSTMENT_GAIN', 'TRANSFER_IN']);

    if (isOut && qty - moveQty < 0) continue;

    await recordMovement(prisma, ctx, {
      branchId,
      branchCode: branch.branchCode,
      medicineId: batch.medicineId,
      batchId,
      movementType: type,
      direction: isOut ? 'OUT' : 'IN',
      quantity: moveQty,
      unitCost: batch.purchaseRate,
      referenceTable: 'seed_movement',
      referenceId: BigInt(i + 1),
      createdBy: userId,
    });
  }

  for (let i = 0; i < 20; i++) {
    const branch = faker.helpers.arrayElement(ctx.branchRecords);
    const adjUuid = uuid();
    const adj = await prisma.stockAdjustment.create({
      data: {
        uuid: adjUuid,
        adjustmentNumber: docNumber('ADJ', branch.branchCode, i + 1),
        branchId: branch.id,
        adjustmentType: i % 2 === 0 ? 'GAIN' : 'LOSS',
        adjustmentDate: faker.date.recent({ days: 30 }),
        reason: i % 2 === 0 ? 'Physical count surplus' : 'Damaged units written off',
        status: 'POSTED',
        approvedByEmployeeId: ctx.employeeIds[0],
        approvedAt: new Date(),
        createdBy: userId,
        isActive: true,
      },
    });

    const itemCount = 2;
    for (let j = 0; j < itemCount; j++) {
      const batch = faker.helpers.arrayElement(ctx.batchRecords);
      const qty = faker.number.int({ min: 1, max: 5 });
      await prisma.stockAdjustmentItem.create({
        data: {
          uuid: uuid(),
          stockAdjustmentId: adj.id,
          batchId: batch.id,
          quantity: decimal(i % 2 === 0 ? qty : -qty),
          unitCost: batch.purchaseRate,
        },
      });
    }
  }

  for (let i = 0; i < 15; i++) {
    const from = faker.helpers.arrayElement(ctx.branchRecords);
    let to = faker.helpers.arrayElement(ctx.branchRecords);
    while (to.id === from.id) to = faker.helpers.arrayElement(ctx.branchRecords);

    const transfer = await prisma.stockTransfer.create({
      data: {
        uuid: uuid(),
        transferNumber: docNumber('ST', from.branchCode, i + 1),
        sourceBranchId: from.id,
        destinationBranchId: to.id,
        transferDate: faker.date.recent({ days: 20 }),
        status: 'COMPLETED',
        createdBy: userId,
      },
    });

    for (let j = 0; j < 2; j++) {
      const batch = faker.helpers.arrayElement(ctx.batchRecords);
      const qty = faker.number.int({ min: 2, max: 8 });
      await prisma.stockTransferItem.create({
        data: {
          uuid: uuid(),
          stockTransferId: transfer.id,
          batchId: batch.id,
          sentQuantity: decimal(qty),
          receivedQuantity: decimal(qty),
        },
      });
    }
  }

  for (let i = 0; i < 5; i++) {
    const branch = faker.helpers.arrayElement(ctx.branchRecords);
    const take = await prisma.stockTake.create({
      data: {
        uuid: uuid(),
        stockTakeNumber: docNumber('TK', branch.branchCode, i + 1),
        branchId: branch.id,
        stockTakeDate: faker.date.recent({ days: 15 }),
        status: 'RECONCILED',
        countedByEmployeeId: ctx.employeeIds[1] ?? ctx.employeeIds[0]!,
        approvedByEmployeeId: ctx.employeeIds[0],
        approvedAt: new Date(),
      },
    });

    for (let j = 0; j < 5; j++) {
      const batch = faker.helpers.arrayElement(ctx.batchRecords);
      const systemQty = ctx.getStock(branch.id, batch.id);
      const physical = systemQty + faker.number.int({ min: -2, max: 2 });
      const variance = physical - systemQty;
      const varianceType = variance === 0 ? 'MATCHED' : variance > 0 ? 'SURPLUS' : 'DEFICIT';
      await prisma.stockTakeItem.create({
        data: {
          uuid: uuid(),
          stockTakeId: take.id,
          batchId: batch.id,
          systemQuantity: decimal(Math.max(0, systemQty)),
          physicalQuantity: decimal(Math.max(0, physical)),
          varianceQuantity: decimal(variance),
          unitCost: batch.purchaseRate,
          varianceValue: decimal(Math.abs(variance) * Number(batch.purchaseRate)),
          varianceType,
        },
      });
    }
  }
}

export { recordMovement };
