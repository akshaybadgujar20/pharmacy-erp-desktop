import { Area } from '@prisma/client';
import { serializeEpochMs } from '../utils/masters.util';

export interface AreaResponse {
  id: string;
  uuid: string;
  cityId: string;
  areaCode: string;
  areaName: string;
  postalCode: string | null;
  deliveryZone: string | null;
  routeCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: string;
}

export function toAreaResponse(area: Area): AreaResponse {
  return {
    id: area.id.toString(),
    uuid: area.uuid,
    cityId: area.cityId.toString(),
    areaCode: area.areaCode,
    areaName: area.areaName,
    postalCode: area.postalCode,
    deliveryZone: area.deliveryZone,
    routeCode: area.routeCode,
    latitude: area.latitude,
    longitude: area.longitude,
    isActive: area.isActive,
    createdAt: serializeEpochMs(area.createdAt) ?? '',
    updatedAt: serializeEpochMs(area.updatedAt) ?? '',
    deletedAt: serializeEpochMs(area.deletedAt),
    version: area.version.toString(),
  };
}
