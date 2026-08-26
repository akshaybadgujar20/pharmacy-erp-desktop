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
  purchaseInvoiceSeqByBranch = new Map<string, number>();
  purchaseReturnSeqByBranch = new Map<string, number>();
  salesReturnSeqByBranch = new Map<string, number>();
  paymentSeqByBranch = new Map<string, number>();
  adjustmentSeqByBranch = new Map<string, number>();
  transferSeqByBranch = new Map<string, number>();
  takeSeqByBranch = new Map<string, number>();
  expenseSeqByBranch = new Map<string, number>();
  prescriptionSeqByBranch = new Map<string, number>();
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

  nextPurchaseInvoiceSeq(branchCode: string): number {
    const next = (this.purchaseInvoiceSeqByBranch.get(branchCode) ?? 0) + 1;
    this.purchaseInvoiceSeqByBranch.set(branchCode, next);
    return next;
  }

  nextPurchaseReturnSeq(branchCode: string): number {
    const next = (this.purchaseReturnSeqByBranch.get(branchCode) ?? 0) + 1;
    this.purchaseReturnSeqByBranch.set(branchCode, next);
    return next;
  }

  nextSalesReturnSeq(branchCode: string): number {
    const next = (this.salesReturnSeqByBranch.get(branchCode) ?? 0) + 1;
    this.salesReturnSeqByBranch.set(branchCode, next);
    return next;
  }

  nextPaymentSeq(branchCode: string): number {
    const next = (this.paymentSeqByBranch.get(branchCode) ?? 0) + 1;
    this.paymentSeqByBranch.set(branchCode, next);
    return next;
  }

  nextAdjustmentSeq(branchCode: string): number {
    const next = (this.adjustmentSeqByBranch.get(branchCode) ?? 0) + 1;
    this.adjustmentSeqByBranch.set(branchCode, next);
    return next;
  }

  nextTransferSeq(branchCode: string): number {
    const next = (this.transferSeqByBranch.get(branchCode) ?? 0) + 1;
    this.transferSeqByBranch.set(branchCode, next);
    return next;
  }

  nextTakeSeq(branchCode: string): number {
    const next = (this.takeSeqByBranch.get(branchCode) ?? 0) + 1;
    this.takeSeqByBranch.set(branchCode, next);
    return next;
  }

  nextExpenseSeq(branchCode: string): number {
    const next = (this.expenseSeqByBranch.get(branchCode) ?? 0) + 1;
    this.expenseSeqByBranch.set(branchCode, next);
    return next;
  }

  nextPrescriptionSeq(branchCode: string): number {
    const next = (this.prescriptionSeqByBranch.get(branchCode) ?? 0) + 1;
    this.prescriptionSeqByBranch.set(branchCode, next);
    return next;
  }
}
