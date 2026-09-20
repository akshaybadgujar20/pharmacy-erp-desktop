import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { computeSalesRoundOff, assertSalesReturnPolicy } from './sales.util';

describe('computeSalesRoundOff', () => {
  it('rounds to nearest whole currency unit', () => {
    const result = computeSalesRoundOff(new Prisma.Decimal('100.60'));

    expect(result.netAmount.toString()).toBe('101');
    expect(result.roundOffAmount.toString()).toBe('0.4');
  });
});

describe('assertSalesReturnPolicy', () => {
  it('rejects returns outside the configured window', async () => {
    const tx = { medicine: { findMany: jest.fn().mockResolvedValue([]) } };

    await expect(
      assertSalesReturnPolicy(tx as never, {
        invoiceDate: 1_700_000_000_000n,
        returnDate: 1_704_000_000_000n,
        returnWindowDays: 30,
        items: [],
        returnRequiresPharmacistForScheduleH: false,
        approvedByEmployeeId: null,
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.RETURN_WINDOW_EXCEEDED,
    });
  });

  it('requires pharmacist approval for schedule H medicines', async () => {
    const tx = {
      medicine: {
        findMany: jest.fn().mockResolvedValue([
          {
            schedule: { scheduleCode: 'H', controlledSubstance: false },
          },
        ]),
      },
    };

    await expect(
      assertSalesReturnPolicy(tx as never, {
        invoiceDate: 1_700_000_000_000n,
        returnDate: 1_700_100_000_000n,
        returnWindowDays: 30,
        items: [{ medicineId: 1n }],
        returnRequiresPharmacistForScheduleH: true,
        approvedByEmployeeId: null,
      }),
    ).rejects.toBeInstanceOf(ApplicationException);
  });
});
