import { computePurchaseInvoiceMatchStatus } from '../src/purchase/utils/purchase-invoice-match.util';

describe('Purchase invoice match summary (e2e helper)', () => {
  it('classifies aligned invoice and GRN as MATCHED', () => {
    expect(computePurchaseInvoiceMatchStatus(true, 2, 20, 2, 20)).toBe('MATCHED');
  });
});
