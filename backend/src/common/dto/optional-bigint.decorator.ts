import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches } from 'class-validator';

export function optionalBigIntTransform({
  value,
}: {
  value: string | undefined;
}): bigint | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (!/^\d+$/.test(value)) {
    return undefined;
  }
  return BigInt(value);
}

export function OptionalBigIntField() {
  return function (target: object, propertyKey: string) {
    IsOptional()(target, propertyKey);
    IsString()(target, propertyKey);
    Matches(/^\d+$/, {
      message: `${propertyKey} must be a numeric string`,
    })(target, propertyKey);
    Transform(optionalBigIntTransform)(target, propertyKey);
  };
}
