import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { coerceToBigInt } from '../../common/dto/coerce-to-bigint';

@ValidatorConstraint({ name: 'isBigIntArray', async: false })
class IsBigIntArrayConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return (
      Array.isArray(value) && value.every((item) => typeof item === 'bigint')
    );
  }

  defaultMessage(): string {
    return 'each element must be a numeric string';
  }
}

function toBigIntArray(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map((item: unknown) => coerceToBigInt(item) ?? item);
}

export class ReplaceUserRolesDto {
  @IsArray()
  @ArrayMinSize(0)
  @Transform(({ value }: { value: unknown }) => toBigIntArray(value))
  @Validate(IsBigIntArrayConstraint)
  roleIds!: bigint[];
}
