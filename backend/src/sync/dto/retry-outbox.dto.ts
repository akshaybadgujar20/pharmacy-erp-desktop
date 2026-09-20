import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class RetryOutboxDto {
  @MandatoryBigIntField()
  version!: bigint;
}
