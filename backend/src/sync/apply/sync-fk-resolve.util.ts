import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import {
  SyncApplyError,
  asBigInt,
  asOptionalBigInt,
  asOptionalString,
  asString,
} from './sync-apply.util';

export type UuidIdLookup = {
  findFirst: (args: {
    where: { uuid: string };
    select?: { id: true };
  }) => Promise<{ id: bigint } | null>;
};

export async function requireIdByUuid(
  delegate: UuidIdLookup,
  uuidValue: unknown,
  label: string,
): Promise<bigint> {
  const uuid = asOptionalString(uuidValue);
  if (!uuid) {
    throw new SyncApplyError(`Missing ${label}`);
  }
  const row = await delegate.findFirst({
    where: { uuid },
    select: { id: true },
  });
  if (!row) {
    throw new SyncApplyError(`Unknown ${label}: ${uuid}`);
  }
  return row.id;
}

export async function optionalIdByUuid(
  delegate: UuidIdLookup,
  uuidValue: unknown,
  label: string,
): Promise<bigint | null> {
  const uuid = asOptionalString(uuidValue);
  if (!uuid) {
    return null;
  }
  const row = await delegate.findFirst({
    where: { uuid },
    select: { id: true },
  });
  if (!row) {
    throw new SyncApplyError(`Unknown ${label}: ${uuid}`);
  }
  return row.id;
}

/** Resolve bigint id from payload: prefer *Uuid lookup, else numeric *Id. */
export async function resolveIdField(
  delegate: UuidIdLookup | null,
  data: Record<string, unknown>,
  idKey: string,
  uuidKey: string,
  label: string,
  required: boolean,
): Promise<bigint | null | undefined> {
  const uuid = asOptionalString(data[uuidKey]);
  if (uuid && delegate) {
    return requireIdByUuid(delegate, uuid, label);
  }
  if (uuid && !delegate) {
    throw new SyncApplyError(`Cannot resolve ${label} without lookup`);
  }
  const raw = data[idKey];
  if (raw == null || raw === '') {
    if (required) {
      throw new SyncApplyError(`Missing ${label}`);
    }
    return null;
  }
  return asBigInt(raw, label);
}

export async function resolveOptionalIdField(
  delegate: UuidIdLookup | null,
  data: Record<string, unknown>,
  idKey: string,
  uuidKey: string,
  label: string,
): Promise<bigint | null> {
  const uuid = asOptionalString(data[uuidKey]);
  if (uuid && delegate) {
    return optionalIdByUuid(delegate, uuid, label);
  }
  return asOptionalBigInt(data[idKey]) ?? null;
}

const STRIP_KEYS = new Set([
  'id',
  'lines',
  'items',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'version',
]);

export function stripIncomingSyncData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (STRIP_KEYS.has(key)) {
      continue;
    }
    if (key.endsWith('Id') && !key.endsWith('Uuid')) {
      const uuidKey = `${key.slice(0, -2)}Uuid`;
      if (typeof data[uuidKey] === 'string' && data[uuidKey] !== '') {
        continue;
      }
    }
    out[key] = value;
  }
  return out;
}

export function txBranchLookup(tx: TxClient): UuidIdLookup {
  return tx.branch;
}

export function txMedicineLookup(tx: TxClient): UuidIdLookup {
  return tx.medicine;
}

export function txBatchLookup(tx: TxClient): UuidIdLookup {
  return tx.batch;
}

export function txCustomerLookup(tx: TxClient): UuidIdLookup {
  return tx.customer;
}

export function txSupplierLookup(tx: TxClient): UuidIdLookup {
  return tx.supplier;
}

export function txDoctorLookup(tx: TxClient): UuidIdLookup {
  return tx.doctor;
}

export function txEmployeeLookup(tx: TxClient): UuidIdLookup {
  return tx.employee;
}

export function txUnitLookup(tx: TxClient): UuidIdLookup {
  return tx.unitOfMeasure;
}

export function txTaxLookup(tx: TxClient): UuidIdLookup {
  return tx.tax;
}

export function txPriceListLookup(tx: TxClient): UuidIdLookup {
  return tx.priceList;
}

export function txPrescriptionLookup(tx: TxClient): UuidIdLookup {
  return tx.prescription;
}

export function txPurchaseOrderLookup(tx: TxClient): UuidIdLookup {
  return tx.purchaseOrder;
}

export function txSalesInvoiceLookup(tx: TxClient): UuidIdLookup {
  return tx.salesInvoice;
}

export function txLedgerLookup(tx: TxClient): UuidIdLookup {
  return tx.ledger;
}

export function txLoyaltyProgramLookup(tx: TxClient): UuidIdLookup {
  return tx.loyaltyProgram;
}

export function txMedicineCategoryLookup(tx: TxClient): UuidIdLookup {
  return tx.medicineCategory;
}

export function txGoodsReceiptLookup(tx: TxClient): UuidIdLookup {
  return tx.goodsReceipt;
}

export function txPurchaseInvoiceLookup(tx: TxClient): UuidIdLookup {
  return tx.purchaseInvoice;
}

export function txPurchaseReturnLookup(tx: TxClient): UuidIdLookup {
  return tx.purchaseReturn;
}

export function txSalesReturnLookup(tx: TxClient): UuidIdLookup {
  return tx.salesReturn;
}

export function pickString(
  data: Record<string, unknown>,
  key: string,
  required = true,
): string | null | undefined {
  const v = data[key];
  if (v == null || v === '') {
    if (required) {
      return asString(v, key);
    }
    return null;
  }
  return asString(v, key);
}
