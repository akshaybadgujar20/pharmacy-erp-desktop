import { MandatoryBigIntArrayField } from '../../common/dto/bigint.decorator';

export class ReplaceUserRolesDto {
  @MandatoryBigIntArrayField()
  roleIds!: bigint[];
}
