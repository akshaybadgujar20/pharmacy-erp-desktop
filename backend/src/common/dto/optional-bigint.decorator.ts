import { Transform } from 'class-transformer';
import {
  IsOptional,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { coerceToBigInt } from './coerce-to-bigint';

@ValidatorConstraint({ name: 'isBigInt', async: false })
export class IsBigIntConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'bigint';
  }

  defaultMessage(): string {
    return 'must be a numeric string';
  }
}

export function OptionalBigIntField() {
  return function (target: object, propertyKey: string) {
    IsOptional()(target, propertyKey);
    Transform(({ value }: { value: unknown }) => {
      const coerced = coerceToBigInt(value);
      if (coerced !== undefined) {
        return coerced;
      }
      if (value === undefined || value === null || value === '') {
        return undefined;
      }
      return value;
    })(target, propertyKey);
    Validate(IsBigIntConstraint, {
      message: `${propertyKey} must be a numeric string`,
    })(target, propertyKey);
  };
}
