import { Supplier } from '@prisma/client';
import {
  serializeBigInt,
  serializeDate,
  serializeDecimal,
} from '../utils/party.util';

export interface SupplierResponse {
  id: string;
  partyId: string;
  uuid: string;
  supplierCode: string;
  supplierType: string;
  gstin: string | null;
  drugLicenseNumber: string | null;
  panNumber: string | null;
  creditLimit: string;
  outstandingAmount: string;
  paymentTermsDays: number;
  preferredSupplier: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  version: number;
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
    creditLimit: serializeDecimal(supplier.creditLimit) ?? '0',
    outstandingAmount: serializeDecimal(supplier.outstandingAmount) ?? '0',
    paymentTermsDays: supplier.paymentTermsDays,
    preferredSupplier: supplier.preferredSupplier,
    isActive: supplier.isActive,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
    deletedAt: serializeDate(supplier.deletedAt),
    updatedBy: serializeBigInt(supplier.updatedBy),
    deletedBy: serializeBigInt(supplier.deletedBy),
    version: supplier.version,
  };
}
