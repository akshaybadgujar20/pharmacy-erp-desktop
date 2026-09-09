import { Transform } from 'class-transformer';
import { IsArray } from 'class-validator';
import { coerceToBigInt } from '../../common/dto/coerce-to-bigint';

function toBigIntArray(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map((item: unknown) => coerceToBigInt(item) ?? item);
}

export class ReplaceRolePermissionsDto {
  @IsArray()
  @Transform(({ value }: { value: unknown }) => toBigIntArray(value))
  permissionIds!: bigint[];
}
