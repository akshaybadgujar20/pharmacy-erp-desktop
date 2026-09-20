import { State } from '@prisma/client';
import { serializeEpochMs } from '../utils/masters.util';

export interface StateResponse {
  id: string;
  uuid: string;
  countryId: string;
  stateCode: string;
  stateName: string;
  gstStateCode: string | null;
  isoCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: string;
}

export function toStateResponse(state: State): StateResponse {
  return {
    id: state.id.toString(),
    uuid: state.uuid,
    countryId: state.countryId.toString(),
    stateCode: state.stateCode,
    stateName: state.stateName,
    gstStateCode: state.gstStateCode,
    isoCode: state.isoCode,
    isActive: state.isActive,
    createdAt: serializeEpochMs(state.createdAt) ?? '',
    updatedAt: serializeEpochMs(state.updatedAt) ?? '',
    deletedAt: serializeEpochMs(state.deletedAt),
    version: state.version.toString(),
  };
}
