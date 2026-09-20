export interface Customer {
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
  version: string;
}

export interface CreateCustomerRequest {
  partyId: string;
  customerCode: string;
  customerType: string;
  creditLimit?: number;
  outstandingAmount?: number;
  paymentTermsDays?: number;
  isTaxExempt?: boolean;
  isActive?: boolean;
}

export interface UpdateCustomerRequest {
  version: string;
  customerCode?: string;
  customerType?: string;
  creditLimit?: number;
  outstandingAmount?: number;
  paymentTermsDays?: number;
  isTaxExempt?: boolean;
  isActive?: boolean;
}
