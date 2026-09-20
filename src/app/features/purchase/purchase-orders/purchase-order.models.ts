import { PurchaseWorkflowRequest } from '../purchase-workflow.models';

export interface PurchaseOrder {
  id: string;
  uuid: string;
  purchaseOrderNumber: string;
  supplierId: string;
  branchId: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  grossAmount: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  netAmount: number | null;
  status: string;
  remarks: string | null;
  approvedByEmployeeId: string | null;
  approvedAt: string | null;
  version: string;
}

export interface CreatePurchaseOrderRequest {
  branchId: string;
  supplierId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  remarks?: string;
}

export interface UpdatePurchaseOrderRequest {
  version: string;
  supplierId?: string;
  orderDate?: string;
  expectedDeliveryDate?: string | null;
  remarks?: string;
}

export type PurchaseOrderWorkflowRequest = PurchaseWorkflowRequest;
