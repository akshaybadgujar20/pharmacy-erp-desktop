import { ValidationPipe } from '@nestjs/common';
import { LoginDto } from '../../auth/dto/login.dto';
import { OptionalBigIntField } from './optional-bigint.decorator';

class OptionalBigIntDto {
  @OptionalBigIntField()
  branchId?: bigint;
}

describe('OptionalBigIntField', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
  });

  it('accepts numeric string and coerces to bigint', async () => {
    const dto = (await pipe.transform(
      { branchId: '38' },
      { type: 'body', metatype: OptionalBigIntDto },
    )) as OptionalBigIntDto;

    expect(dto.branchId).toBe(38n);
  });

  it('accepts integer number and coerces to bigint', async () => {
    const dto = (await pipe.transform(
      { branchId: 38 },
      { type: 'body', metatype: OptionalBigIntDto },
    )) as OptionalBigIntDto;

    expect(dto.branchId).toBe(38n);
  });

  it('allows omitted optional field', async () => {
    const dto = (await pipe.transform(
      {},
      { type: 'body', metatype: OptionalBigIntDto },
    )) as OptionalBigIntDto;

    expect(dto.branchId).toBeUndefined();
  });

  it('rejects non-numeric string', async () => {
    await expect(
      pipe.transform(
        { branchId: 'abc' },
        { type: 'body', metatype: OptionalBigIntDto },
      ),
    ).rejects.toThrow();
  });

  it('coerces branchId on LoginDto', async () => {
    const dto = (await pipe.transform(
      {
        username: 'admin',
        password: 'admin123',
        branchId: '38',
      },
      { type: 'body', metatype: LoginDto },
    )) as LoginDto;

    expect(dto.branchId).toBe(38n);
    expect(dto.username).toBe('admin');
  });
});
