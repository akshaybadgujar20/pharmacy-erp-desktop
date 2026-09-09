import { Company } from '@prisma/client';
import { serializeEpochMs } from '../utils/configuration.util';

export interface CompanyResponse {
  id: string;
  uuid: string;
  companyCode: string;
  companyName: string;
  displayName: string;
  gstNumber: string | null;
  panNumber: string | null;
  drugLicenseNumber: string | null;
  email: string | null;
  phoneNumber: string | null;
  website: string | null;
  logoPath: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pinCode: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toCompanyResponse(company: Company): CompanyResponse {
  return {
    id: company.id.toString(),
    uuid: company.uuid,
    companyCode: company.companyCode,
    companyName: company.companyName,
    displayName: company.displayName,
    gstNumber: company.gstNumber,
    panNumber: company.panNumber,
    drugLicenseNumber: company.drugLicenseNumber,
    email: company.email,
    phoneNumber: company.phoneNumber,
    website: company.website,
    logoPath: company.logoPath,
    addressLine1: company.addressLine1,
    addressLine2: company.addressLine2,
    city: company.city,
    state: company.state,
    country: company.country,
    pinCode: company.pinCode,
    isDefault: company.isDefault,
    isActive: company.isActive,
    createdAt: serializeEpochMs(company.createdAt) ?? '',
    updatedAt: serializeEpochMs(company.updatedAt) ?? '',
    deletedAt: serializeEpochMs(company.deletedAt),
    version: company.version,
  };
}
