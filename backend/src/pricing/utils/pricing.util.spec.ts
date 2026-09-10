import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../../common/exceptions/error-code';
import { AppliesTo } from '../constants/pricing.constants';
import {
  buildPriceListListWhere,
  resolveDiscountRuleAppliesTo,
  hardDeletePriceListItemSlot,
} from './pricing.util';

describe('buildPriceListListWhere', () => {
  it('combines branch filter and search with AND so search cannot bypass branch scope', () => {
    const where = buildPriceListListWhere(2n, { search: 'retail' });

    expect(where).toMatchObject({
      deletedAt: null,
      AND: [
        { OR: [{ branchId: 2n }, { branchId: null }] },
        {
          OR: [
            { priceListCode: { contains: 'retail' } },
            { priceListName: { contains: 'retail' } },
          ],
        },
      ],
    });
  });
});

describe('resolveDiscountRuleAppliesTo', () => {
  it('requires medicineId for MEDICINE appliesTo', () => {
    try {
      resolveDiscountRuleAppliesTo(AppliesTo.MEDICINE, { medicineId: null });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toMatchObject({
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  });

  it('clears unrelated FKs for MEDICINE appliesTo', () => {
    const resolved = resolveDiscountRuleAppliesTo(AppliesTo.MEDICINE, {
      medicineId: 10n,
      categoryId: 20n,
    });

    expect(resolved).toEqual({
      medicineId: 10n,
      categoryId: null,
      customerId: null,
      priceListId: null,
    });
  });

  it('clears all FKs for GLOBAL appliesTo', () => {
    const resolved = resolveDiscountRuleAppliesTo(AppliesTo.GLOBAL, {
      medicineId: 10n,
      customerId: 30n,
    });

    expect(resolved).toEqual({
      medicineId: null,
      categoryId: null,
      customerId: null,
      priceListId: null,
    });
  });

  it('requires priceListId for PRICE_LIST appliesTo', () => {
    try {
      resolveDiscountRuleAppliesTo(AppliesTo.PRICE_LIST, { priceListId: null });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toMatchObject({
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  });
});

describe('hardDeletePriceListItemSlot', () => {
  it('hard-deletes an existing row for the medicine slot', async () => {
    const deleteMock = jest.fn();
    const tx = {
      priceListItem: {
        findFirst: jest.fn().mockResolvedValue({ id: 99n }),
        delete: deleteMock,
      },
    };

    await hardDeletePriceListItemSlot(tx as never, 1n, 5n);

    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 99n } });
  });

  it('does nothing when no row exists for the slot', async () => {
    const deleteMock = jest.fn();
    const tx = {
      priceListItem: {
        findFirst: jest.fn().mockResolvedValue(null),
        delete: deleteMock,
      },
    };

    await hardDeletePriceListItemSlot(tx as never, 1n, 5n);

    expect(deleteMock).not.toHaveBeenCalled();
  });
});
