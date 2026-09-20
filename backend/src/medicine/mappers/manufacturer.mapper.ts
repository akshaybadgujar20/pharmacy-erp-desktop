import { Manufacturer } from '@prisma/client';

export interface ManufacturerResponse {
  id: string;
  partyId: string;
  uuid: string;
  manufacturerCode: string;
  manufacturingLicenseNo: string | null;
  gstin: string | null;
  website: string | null;
  email: string | null;
  supportPhone: string | null;
  isPreferred: boolean;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toManufacturerResponse(
  manufacturer: Manufacturer,
): ManufacturerResponse {
  return {
    id: manufacturer.id.toString(),
    partyId: manufacturer.partyId.toString(),
    uuid: manufacturer.uuid,
    manufacturerCode: manufacturer.manufacturerCode,
    manufacturingLicenseNo: manufacturer.manufacturingLicenseNo,
    gstin: manufacturer.gstin,
    website: manufacturer.website,
    email: manufacturer.email,
    supportPhone: manufacturer.supportPhone,
    isPreferred: manufacturer.isPreferred,
    isActive: manufacturer.isActive,
    createdAt: manufacturer.createdAt,
    updatedAt: manufacturer.updatedAt,
    deletedAt: manufacturer.deletedAt,
    version: manufacturer.version.toString(),
  };
}
