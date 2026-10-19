export type PurchaseInvoiceMatchStatus =
  | 'NO_GRN'
  | 'MATCHED'
  | 'PARTIAL'
  | 'MISMATCH';

export type PurchaseInvoiceMatchLineStatus =
  | 'MATCHED'
  | 'MISMATCH'
  | 'MISSING_ON_GRN'
  | 'MISSING_ON_INVOICE';

export interface PurchaseInvoiceMatchLine {
  medicineId: string;
  medicineName: string | null;
  invoiceQty: number;
  grnQty: number;
  lineStatus: PurchaseInvoiceMatchLineStatus;
}

export function computePurchaseInvoiceMatchStatus(
  hasGrn: boolean,
  invoiceLineCount: number,
  invoiceTotalQty: number,
  grnLineCount: number,
  grnTotalQty: number,
): PurchaseInvoiceMatchStatus {
  if (!hasGrn) {
    return 'NO_GRN';
  }
  if (invoiceLineCount !== grnLineCount) {
    return 'PARTIAL';
  }
  if (Math.abs(invoiceTotalQty - grnTotalQty) > 0.001) {
    return 'MISMATCH';
  }
  return 'MATCHED';
}

export function buildPurchaseInvoiceMatchLines(
  invoiceItems: {
    medicineId: bigint;
    invoiceQuantity: { toNumber?: () => number } | number;
    medicine?: { medicineName: string } | null;
  }[],
  grnItems: {
    medicineId: bigint;
    acceptedQuantity: { toNumber?: () => number } | number;
    medicine?: { medicineName: string } | null;
  }[],
): PurchaseInvoiceMatchLine[] {
  const toQty = (value: { toNumber?: () => number } | number): number =>
    typeof value === 'number' ? value : (value.toNumber?.() ?? Number(value));

  const invoiceByMedicine = new Map<
    string,
    { qty: number; name: string | null }
  >();
  for (const row of invoiceItems) {
    const key = row.medicineId.toString();
    const existing = invoiceByMedicine.get(key);
    const qty = toQty(row.invoiceQuantity);
    invoiceByMedicine.set(key, {
      qty: (existing?.qty ?? 0) + qty,
      name: row.medicine?.medicineName ?? existing?.name ?? null,
    });
  }

  const grnByMedicine = new Map<string, { qty: number; name: string | null }>();
  for (const row of grnItems) {
    const key = row.medicineId.toString();
    const existing = grnByMedicine.get(key);
    const qty = toQty(row.acceptedQuantity);
    grnByMedicine.set(key, {
      qty: (existing?.qty ?? 0) + qty,
      name: row.medicine?.medicineName ?? existing?.name ?? null,
    });
  }

  const medicineIds = new Set([
    ...invoiceByMedicine.keys(),
    ...grnByMedicine.keys(),
  ]);

  const lines: PurchaseInvoiceMatchLine[] = [];
  for (const medicineId of medicineIds) {
    const invoice = invoiceByMedicine.get(medicineId);
    const grn = grnByMedicine.get(medicineId);
    const invoiceQty = invoice?.qty ?? 0;
    const grnQty = grn?.qty ?? 0;
    let lineStatus: PurchaseInvoiceMatchLineStatus = 'MATCHED';
    if (invoiceQty <= 0 && grnQty > 0) {
      lineStatus = 'MISSING_ON_INVOICE';
    } else if (grnQty <= 0 && invoiceQty > 0) {
      lineStatus = 'MISSING_ON_GRN';
    } else if (Math.abs(invoiceQty - grnQty) > 0.001) {
      lineStatus = 'MISMATCH';
    }
    lines.push({
      medicineId,
      medicineName: invoice?.name ?? grn?.name ?? null,
      invoiceQty,
      grnQty,
      lineStatus,
    });
  }

  return lines.sort((a, b) => a.medicineId.localeCompare(b.medicineId));
}
