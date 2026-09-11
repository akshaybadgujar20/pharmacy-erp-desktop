export interface Receipt {
  id: string;
  uuid: string;
  receiptNumber: string;
  receiptType: string;
  receiptDate: string;
  amount: number | null;
  receiptMethod: string;
  transactionReference: string | null;
  referenceType: string | null;
  referenceId: string | null;
  status: string;
  remarks: string | null;
  version: number;
}

export interface CreateReceiptRequest {
  receiptType: string;
  receiptDate: string;
  amount: number;
  receiptMethod: string;
  transactionReference?: string;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
}

export interface UpdateReceiptRequest {
  version: number;
  receiptType?: string;
  receiptDate?: string;
  amount?: number;
  receiptMethod?: string;
  transactionReference?: string;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
}

export interface FinanceWorkflowRequest {
  version: number;
  remarks?: string;
}
