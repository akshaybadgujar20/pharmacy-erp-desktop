import { Country } from '@prisma/client';
import { serializeEpochMs } from '../utils/masters.util';

export interface CountryResponse {
  id: string;
  uuid: string;
  countryCode: string;
  isoAlpha2: string;
  isoAlpha3: string;
  countryName: string;
  nationality: string | null;
  phoneCode: string | null;
  currencyCode: string | null;
  timezone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: string;
}

export function toCountryResponse(country: Country): CountryResponse {
  return {
    id: country.id.toString(),
    uuid: country.uuid,
    countryCode: country.countryCode,
    isoAlpha2: country.isoAlpha2,
    isoAlpha3: country.isoAlpha3,
    countryName: country.countryName,
    nationality: country.nationality,
    phoneCode: country.phoneCode,
    currencyCode: country.currencyCode,
    timezone: country.timezone,
    isActive: country.isActive,
    createdAt: serializeEpochMs(country.createdAt) ?? '',
    updatedAt: serializeEpochMs(country.updatedAt) ?? '',
    deletedAt: serializeEpochMs(country.deletedAt),
    version: country.version.toString(),
  };
}
