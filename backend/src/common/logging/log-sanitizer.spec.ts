import { Prisma } from '@prisma/client';

import { redactSensitiveFields, safeSerializeValue } from './log-sanitizer';

describe('log-sanitizer', () => {
  describe('safeSerializeValue', () => {
    it('converts bigint to string', () => {
      expect(safeSerializeValue(42n)).toBe('42');
    });

    it('converts Prisma.Decimal to string', () => {
      expect(safeSerializeValue(new Prisma.Decimal('12.50'))).toBe('12.5');
    });

    it('serializes nested objects with bigint values', () => {
      expect(
        safeSerializeValue({ saleId: 99n, nested: { batchId: 1n } }),
      ).toEqual({
        saleId: '99',
        nested: { batchId: '1' },
      });
    });
  });

  describe('redactSensitiveFields', () => {
    it('redacts sensitive keys', () => {
      const result = redactSensitiveFields({
        password: 'secret',
        pin: '1234',
        token: 'abc',
        accessToken: 'at',
        refreshToken: 'rt',
        authorization: 'Bearer x',
        saleId: 1n,
      });

      expect(result).toEqual({
        password: '[REDACTED]',
        pin: '[REDACTED]',
        token: '[REDACTED]',
        accessToken: '[REDACTED]',
        refreshToken: '[REDACTED]',
        authorization: '[REDACTED]',
        saleId: '1',
      });
    });
  });
});
