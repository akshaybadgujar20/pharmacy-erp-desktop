import { Branch } from '@prisma/client';
import { serializeEpochMs } from '../utils/configuration.util';

export interface BranchResponse {
  id: string;
  uuid: string;
  companyId: string;
  branchCode: string;
  branchName: string;
  displayName: string;
  gstNumber: string | null;
  drugLicenseNumber: string | null;
  email: string | null;
  phoneNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pinCode: string | null;
  managerName: string | null;
  openingDate: string | null;
  isHeadOffice: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toBranchResponse(branch: Branch): BranchResponse {
  return {
    id: branch.id.toString(),
    uuid: branch.uuid,
    companyId: branch.companyId.toString(),
    branchCode: branch.branchCode,
    branchName: branch.branchName,
    displayName: branch.displayName,
    gstNumber: branch.gstNumber,
    drugLicenseNumber: branch.drugLicenseNumber,
    email: branch.email,
    phoneNumber: branch.phoneNumber,
    addressLine1: branch.addressLine1,
    addressLine2: branch.addressLine2,
    city: branch.city,
    state: branch.state,
    country: branch.country,
    pinCode: branch.pinCode,
    managerName: branch.managerName,
    openingDate: serializeEpochMs(branch.openingDate),
    isHeadOffice: branch.isHeadOffice,
    isActive: branch.isActive,
    createdAt: serializeEpochMs(branch.createdAt) ?? '',
    updatedAt: serializeEpochMs(branch.updatedAt) ?? '',
    deletedAt: serializeEpochMs(branch.deletedAt),
    version: branch.version,
  };
}
