import { CreateLoyaltyProgramDto } from './create-loyalty-program.dto';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class UpdateLoyaltyProgramDto extends CreateLoyaltyProgramDto {
  @MandatoryBigIntField()
  version!: bigint;
}
