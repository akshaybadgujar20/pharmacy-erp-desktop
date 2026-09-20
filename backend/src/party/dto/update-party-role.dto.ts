import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { PartyRoleType } from '../constants/party.constants';

export class UpdatePartyRoleDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(PartyRoleType))
  roleType?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
