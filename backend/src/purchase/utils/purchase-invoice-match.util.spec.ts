import { computePurchaseInvoiceMatchStatus } from './purchase-invoice-match.util';

describe('computePurchaseInvoiceMatchStatus', () => {
  it('returns NO_GRN when no goods receipt', () => {
    expect(computePurchaseInvoiceMatchStatus(false, 2, 10, 0, 0)).toBe('NO_GRN');
  });

  it('returns MATCHED when lines and qty align', () => {
    expect(computePurchaseInvoiceMatchStatus(true, 3, 15, 3, 15)).toBe('MATCHED');
  });

  it('returns PARTIAL when line counts differ', () => {
    expect(computePurchaseInvoiceMatchStatus(true, 2, 10, 3, 10)).toBe('PARTIAL');
  });

  it('returns MISMATCH when qty differs', () => {
    expect(computePurchaseInvoiceMatchStatus(true, 2, 10, 2, 9)).toBe('MISMATCH');
  });
});
