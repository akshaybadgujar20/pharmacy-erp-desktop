import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { coerceToBigInt } from './coerce-to-bigint';

export function coerceToBigIntArray(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map((item: unknown) => coerceToBigInt(item) ?? item);
}

@ValidatorConstraint({ name: 'isBigIntArray', async: false })
export class IsBigIntArrayConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return (
      Array.isArray(value) && value.every((item) => typeof item === 'bigint')
    );
  }

  defaultMessage(): string {
    return 'each element must be a numeric string';
  }
}

@ValidatorConstraint({ name: 'isBigInt', async: false })
export class IsBigIntConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'bigint';
  }

  defaultMessage(): string {
    return 'must be a numeric string';
  }
}

@ValidatorConstraint({ name: 'isBigIntOrNull', async: false })
export class IsBigIntOrNullConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return value === null || typeof value === 'bigint';
  }

  defaultMessage(): string {
    return 'must be a numeric string or null';
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

export function ClearableOptionalBigIntField() {
  return function (target: object, propertyKey: string) {
    IsOptional()(target, propertyKey);
    Transform(({ value }: { value: unknown }) => {
      if (value === null) {
        return null;
      }
      const coerced = coerceToBigInt(value);
      if (coerced !== undefined) {
        return coerced;
      }
      if (value === undefined || value === '') {
        return undefined;
      }
      return value;
    })(target, propertyKey);
    Validate(IsBigIntOrNullConstraint, {
      message: `${propertyKey} must be a numeric string or null`,
    })(target, propertyKey);
  };
}

/** Preserves `null` to clear nullable FK fields on PATCH; omits when `undefined`. */
export const NullableBigIntField = ClearableOptionalBigIntField;

export function MandatoryBigIntField() {
  return function (target: object, propertyKey: string) {
    IsNotEmpty()(target, propertyKey);
    Transform(({ value }: { value: unknown }) => {
      const coerced = coerceToBigInt(value);
      if (coerced !== undefined) {
        return coerced;
      }
      return value;
    })(target, propertyKey);
    Validate(IsBigIntConstraint, {
      message: `${propertyKey} must be a numeric string`,
    })(target, propertyKey);
  };
}

export function MandatoryBigIntArrayField() {
  return function (target: object, propertyKey: string) {
    IsArray()(target, propertyKey);
    ArrayMinSize(0)(target, propertyKey);
    Transform(({ value }: { value: unknown }) => coerceToBigIntArray(value))(
      target,
      propertyKey,
    );
    Validate(IsBigIntArrayConstraint, {
      message: `${propertyKey} must be an array of numeric strings`,
    })(target, propertyKey);
  };
}
