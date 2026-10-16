import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class EnrollCustomerDto {
  @MandatoryBigIntField()
  loyaltyProgramId!: bigint;
}
