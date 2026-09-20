import { Supplier } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/party.util';

export interface SupplierResponse {
  id: string;
  partyId: string;
  uuid: string;
  supplierCode: string;
  supplierType: string;
  gstin: string | null;
  drugLicenseNumber: string | null;
  panNumber: string | null;
  creditLimit: number | null;
  outstandingAmount: number | null;
  paymentTermsDays: number;
  preferredSupplier: boolean;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  updatedBy: string | null;
  deletedBy: string | null;
  version: string;
}

export function toSupplierResponse(supplier: Supplier): SupplierResponse {
  return {
    id: supplier.id.toString(),
    partyId: supplier.partyId.toString(),
    uuid: supplier.uuid,
    supplierCode: supplier.supplierCode,
    supplierType: supplier.supplierType,
    gstin: supplier.gstin,
    drugLicenseNumber: supplier.drugLicenseNumber,
    panNumber: supplier.panNumber,
    creditLimit: serializeDecimal(supplier.creditLimit),
    outstandingAmount: serializeDecimal(supplier.outstandingAmount),
    paymentTermsDays: supplier.paymentTermsDays,
    preferredSupplier: supplier.preferredSupplier,
    isActive: supplier.isActive,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
    deletedAt: supplier.deletedAt,
    updatedBy: serializeBigInt(supplier.updatedBy),
    deletedBy: serializeBigInt(supplier.deletedBy),
    version: supplier.version.toString(),
  };
}
