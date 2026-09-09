import { City } from '@prisma/client';
import { serializeEpochMs } from '../utils/masters.util';

export interface CityResponse {
  id: string;
  uuid: string;
  stateId: string;
  cityCode: string;
  cityName: string;
  district: string | null;
  postalRegion: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toCityResponse(city: City): CityResponse {
  return {
    id: city.id.toString(),
    uuid: city.uuid,
    stateId: city.stateId.toString(),
    cityCode: city.cityCode,
    cityName: city.cityName,
    district: city.district,
    postalRegion: city.postalRegion,
    latitude: city.latitude,
    longitude: city.longitude,
    isActive: city.isActive,
    createdAt: serializeEpochMs(city.createdAt) ?? '',
    updatedAt: serializeEpochMs(city.updatedAt) ?? '',
    deletedAt: serializeEpochMs(city.deletedAt),
    version: city.version,
  };
}
