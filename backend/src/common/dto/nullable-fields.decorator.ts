import { Transform } from 'class-transformer';
import { IsOptional, IsString, ValidateIf } from 'class-validator';

/** Preserves `null` to clear nullable string fields on PATCH; omits when `undefined`. */
export function NullableStringField() {
  return function (target: object, propertyKey: string) {
    IsOptional()(target, propertyKey);
    ValidateIf((_, value) => value !== null)(target, propertyKey);
    IsString()(target, propertyKey);
    Transform(({ value }: { value: unknown }) =>
      value === null ? null : value,
    )(target, propertyKey);
  };
}
