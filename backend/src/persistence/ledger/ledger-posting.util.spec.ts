import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { assertFinancialYearOpenForPosting } from './ledger-posting.util';

describe('assertFinancialYearOpenForPosting', () => {
  const companyId = 1n;
  const transactionDate = 1_700_000_000_000n;

  it('throws when no financial year covers the transaction date', async () => {
    const tx = {
      financialYear: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    await expect(
      assertFinancialYearOpenForPosting(
        tx as never,
        companyId,
        transactionDate,
      ),
    ).rejects.toMatchObject({
      code: ErrorCode.FINANCIAL_YEAR_CLOSED,
    });
  });

  it('throws when the covering financial year is closed', async () => {
    const tx = {
      financialYear: {
        findFirst: jest.fn().mockResolvedValue({
          financialYearCode: 'FY2024',
          status: 'CLOSED',
        }),
      },
    };

    await expect(
      assertFinancialYearOpenForPosting(
        tx as never,
        companyId,
        transactionDate,
      ),
    ).rejects.toBeInstanceOf(ApplicationException);
  });

  it('passes when the covering financial year is open', async () => {
    const tx = {
      financialYear: {
        findFirst: jest.fn().mockResolvedValue({
          financialYearCode: 'FY2025',
          status: 'OPEN',
        }),
      },
    };

    await expect(
      assertFinancialYearOpenForPosting(
        tx as never,
        companyId,
        transactionDate,
      ),
    ).resolves.toBeUndefined();
  });
});
