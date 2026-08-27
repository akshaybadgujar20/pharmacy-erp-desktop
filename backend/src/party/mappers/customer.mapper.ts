import { Customer } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/party.util';

export interface CustomerResponse {
  id: string;
  partyId: string;
  uuid: string;
  customerCode: string;
  customerType: string;
  creditLimit: number | null;
  outstandingAmount: number | null;
  paymentTermsDays: number;
  loyaltyPoints: number;
  isTaxExempt: boolean;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  updatedBy: string | null;
  deletedBy: string | null;
  version: number;
}

export function toCustomerResponse(customer: Customer): CustomerResponse {
  return {
    id: customer.id.toString(),
    partyId: customer.partyId.toString(),
    uuid: customer.uuid,
    customerCode: customer.customerCode,
    customerType: customer.customerType,
    creditLimit: serializeDecimal(customer.creditLimit),
    outstandingAmount: serializeDecimal(customer.outstandingAmount),
    paymentTermsDays: customer.paymentTermsDays,
    loyaltyPoints: customer.loyaltyPoints,
    isTaxExempt: customer.isTaxExempt,
    isActive: customer.isActive,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    deletedAt: customer.deletedAt,
    updatedBy: serializeBigInt(customer.updatedBy),
    deletedBy: serializeBigInt(customer.deletedBy),
    version: customer.version,
  };
}
