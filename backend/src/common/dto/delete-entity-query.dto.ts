import { MandatoryBigIntField } from './bigint.decorator';

export class DeleteEntityQueryDto {
  @MandatoryBigIntField()
  version!: bigint;
}
