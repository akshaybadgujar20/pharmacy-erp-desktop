export type PurchaseInvoiceMatchStatus =
  | 'NO_GRN'
  | 'MATCHED'
  | 'PARTIAL'
  | 'MISMATCH';

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
