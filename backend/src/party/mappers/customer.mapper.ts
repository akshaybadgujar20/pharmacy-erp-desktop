import { Customer } from '@prisma/client';
import {
  serializeBigInt,
  serializeDate,
  serializeDecimal,
} from '../utils/party.util';

export interface CustomerResponse {
  id: string;
  partyId: string;
  uuid: string;
  customerCode: string;
  customerType: string;
  creditLimit: string;
  outstandingAmount: string;
  paymentTermsDays: number;
  loyaltyPoints: number;
  isTaxExempt: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
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
    creditLimit: serializeDecimal(customer.creditLimit) ?? '0',
    outstandingAmount: serializeDecimal(customer.outstandingAmount) ?? '0',
    paymentTermsDays: customer.paymentTermsDays,
    loyaltyPoints: customer.loyaltyPoints,
    isTaxExempt: customer.isTaxExempt,
    isActive: customer.isActive,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
    deletedAt: serializeDate(customer.deletedAt),
    updatedBy: serializeBigInt(customer.updatedBy),
    deletedBy: serializeBigInt(customer.deletedBy),
    version: customer.version,
  };
}
