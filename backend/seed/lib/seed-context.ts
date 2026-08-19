import type { PrismaClient } from '@prisma/client';

export interface BranchRecord {
  id: bigint;
  uuid: string;
  branchCode: string;
}

export interface MedicineRecord {
  id: bigint;
  uuid: string;
  unitId: bigint;
  mrp: string;
}

export interface BatchRecord {
  id: bigint;
  uuid: string;
  medicineId: bigint;
  batchNumber: string;
  expiryDate: Date;
  purchaseRate: string;
  mrp: string;
}

export interface PriceListItemRecord {
  medicineId: bigint;
  sellingPrice: string;
  mrp: string;
  taxId?: bigint;
}

export class SeedContext {
  branchRecords: BranchRecord[] = [];
  medicineRecords: MedicineRecord[] = [];
  batchRecords: BatchRecord[] = [];
  customerIds: bigint[] = [];
  supplierIds: bigint[] = [];
  employeeIds: bigint[] = [];
  employeeUuids: string[] = [];
  userIds: bigint[] = [];
  doctorIds: bigint[] = [];
  taxIds: bigint[] = [];
  defaultPriceListId?: bigint;
  priceListItems = new Map<string, PriceListItemRecord>();
  stockBalances = new Map<string, number>();
  movementSeqByBranch = new Map<string, number>();
  salesSeqByBranch = new Map<string, number>();
  poSeqByBranch = new Map<string, number>();
  grnSeqByBranch = new Map<string, number>();
  entityUuidsForOutbox: string[] = [];

  constructor(public readonly prisma: PrismaClient) {}

  stockKey(branchId: bigint, batchId: bigint): string {
    return `${branchId}:${batchId}`;
  }

  getStock(branchId: bigint, batchId: bigint): number {
    return this.stockBalances.get(this.stockKey(branchId, batchId)) ?? 0;
  }

  setStock(branchId: bigint, batchId: bigint, qty: number): void {
    this.stockBalances.set(this.stockKey(branchId, batchId), qty);
  }

  nextMovementSeq(branchCode: string): number {
    const next = (this.movementSeqByBranch.get(branchCode) ?? 0) + 1;
    this.movementSeqByBranch.set(branchCode, next);
    return next;
  }

  nextSalesSeq(branchCode: string): number {
    const next = (this.salesSeqByBranch.get(branchCode) ?? 0) + 1;
    this.salesSeqByBranch.set(branchCode, next);
    return next;
  }

  nextPoSeq(branchCode: string): number {
    const next = (this.poSeqByBranch.get(branchCode) ?? 0) + 1;
    this.poSeqByBranch.set(branchCode, next);
    return next;
  }

  nextGrnSeq(branchCode: string): number {
    const next = (this.grnSeqByBranch.get(branchCode) ?? 0) + 1;
    this.grnSeqByBranch.set(branchCode, next);
    return next;
  }
}
