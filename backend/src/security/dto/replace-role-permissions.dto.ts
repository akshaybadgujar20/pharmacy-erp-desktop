import { MandatoryBigIntArrayField } from '../../common/dto/bigint.decorator';

export class ReplaceRolePermissionsDto {
  @MandatoryBigIntArrayField()
  permissionIds!: bigint[];
}
