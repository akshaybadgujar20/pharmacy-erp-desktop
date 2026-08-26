import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../prisma/prisma-tx.type';
import { DocumentType } from '../sequence/document-type.constants';
import { SequenceGeneratorService } from '../sequence/sequence-generator.service';

export type StockMovementDirection = 'IN' | 'OUT';

export interface ApplyMovementInput {
  branchId: bigint;
  branchCode: string;
  companyId: bigint;
  medicineId: bigint;
  batchId: bigint;
  direction: StockMovementDirection;
  quantity: Prisma.Decimal | number | string;
  unitCost: Prisma.Decimal | number | string;
  movementType: string;
  referenceTable: string;
  referenceId: bigint;
  createdBy?: bigint;
  remarks?: string;
}

@Injectable()
export class InventoryLedgerService {
  constructor(private readonly sequences: SequenceGeneratorService) {}

  async applyMovement(tx: TxClient, input: ApplyMovementInput) {
    const quantity = new Prisma.Decimal(input.quantity);
    const unitCost = new Prisma.Decimal(input.unitCost);

    if (quantity.lte(0)) {
      throw new ApplicationException(
        ErrorCode.BAD_REQUEST,
        'Movement quantity must be positive',
        HttpStatus.BAD_REQUEST,
      );
    }

    const batch = await tx.batch.findFirst({
      where: { id: input.batchId, deletedAt: null },
      select: { medicineId: true },
    });

    if (!batch) {
      throw new ApplicationException(
        ErrorCode.BATCH_NOT_FOUND,
        'Batch not found',
        HttpStatus.NOT_FOUND,
        { batchId: input.batchId.toString() },
      );
    }

    if (batch.medicineId !== input.medicineId) {
      throw new ApplicationException(
        ErrorCode.BAD_REQUEST,
        'medicineId does not match batch',
        HttpStatus.BAD_REQUEST,
        {
          medicineId: input.medicineId.toString(),
          batchMedicineId: batch.medicineId.toString(),
        },
      );
    }

    const stock = await tx.stock.findFirst({
      where: {
        branchId: input.branchId,
        batchId: input.batchId,
        deletedAt: null,
      },
    });

    const currentAvailable = new Prisma.Decimal(stock?.availableQuantity ?? 0);
    const reservedQuantity = new Prisma.Decimal(stock?.reservedQuantity ?? 0);
    let nextAvailable: Prisma.Decimal;

    if (input.direction === 'IN') {
      nextAvailable = currentAvailable.add(quantity);
    } else {
      if (!stock) {
        throw new ApplicationException(
          ErrorCode.STOCK_NOT_FOUND,
          'Stock record not found for batch at branch',
          HttpStatus.NOT_FOUND,
          { branchId: input.branchId, batchId: input.batchId },
        );
      }

      const sellable = currentAvailable.sub(reservedQuantity);
      if (sellable.lt(quantity)) {
        throw new ApplicationException(
          ErrorCode.STOCK_INSUFFICIENT,
          'Insufficient sellable stock for movement',
          HttpStatus.CONFLICT,
          {
            available: currentAvailable.toString(),
            reserved: reservedQuantity.toString(),
            sellable: sellable.toString(),
            requested: quantity.toString(),
          },
        );
      }
      nextAvailable = currentAvailable.sub(quantity);
    }

    const { documentNumber } = await this.sequences.next(tx, {
      companyId: input.companyId,
      branchId: input.branchId,
      documentType: DocumentType.STOCK_MOVEMENT,
      branchCode: input.branchCode,
    });

    const now = new Date();

    if (stock) {
      const updated = await tx.stock.updateMany({
        where: { id: stock.id, version: stock.version },
        data: {
          availableQuantity: nextAvailable,
          lastMovementAt: now,
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        throw new ApplicationException(
          ErrorCode.ENTITY_VERSION_CONFLICT,
          'Stock row was modified concurrently',
          HttpStatus.CONFLICT,
          undefined,
          true,
        );
      }
    } else {
      await this.createStockOrRetryUpdate(tx, input, nextAvailable, now);
    }

    return tx.stockMovement.create({
      data: {
        movementNumber: documentNumber,
        branchId: input.branchId,
        medicineId: input.medicineId,
        batchId: input.batchId,
        movementType: input.movementType,
        movementDirection: input.direction,
        quantity,
        unitCost,
        balanceAfter: nextAvailable,
        referenceTable: input.referenceTable,
        referenceId: input.referenceId,
        movementDate: now,
        remarks: input.remarks,
        createdBy: input.createdBy,
      },
    });
  }

  private async createStockOrRetryUpdate(
    tx: TxClient,
    input: ApplyMovementInput,
    nextAvailable: Prisma.Decimal,
    now: Date,
  ): Promise<void> {
    try {
      await tx.stock.create({
        data: {
          branchId: input.branchId,
          batchId: input.batchId,
          availableQuantity: nextAvailable,
          lastMovementAt: now,
          isActive: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await tx.stock.findFirst({
          where: {
            branchId: input.branchId,
            batchId: input.batchId,
            deletedAt: null,
          },
        });
        if (!existing) {
          throw error;
        }

        const updated = await tx.stock.updateMany({
          where: { id: existing.id, version: existing.version },
          data: {
            availableQuantity: nextAvailable,
            lastMovementAt: now,
            version: { increment: 1 },
          },
        });
        if (updated.count !== 1) {
          throw new ApplicationException(
            ErrorCode.ENTITY_VERSION_CONFLICT,
            'Stock row was modified concurrently',
            HttpStatus.CONFLICT,
            undefined,
            true,
          );
        }
        return;
      }
      throw error;
    }
  }
}
