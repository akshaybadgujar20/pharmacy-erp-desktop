export interface Payment {
  id: string;
  uuid: string;
  paymentNumber: string;
  paymentType: string;
  paymentDate: string;
  amount: number | null;
  paymentMethod: string;
  transactionReference: string | null;
  referenceType: string | null;
  referenceId: string | null;
  status: string;
  remarks: string | null;
  version: string;
}

export interface CreatePaymentRequest {
  paymentType: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  transactionReference?: string;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
}

export interface UpdatePaymentRequest {
  version: string;
  paymentType?: string;
  paymentDate?: string;
  amount?: number;
  paymentMethod?: string;
  transactionReference?: string;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
}

export interface FinanceWorkflowRequest {
  version: string;
  remarks?: string;
}
