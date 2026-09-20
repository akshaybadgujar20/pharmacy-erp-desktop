import { PurchaseWorkflowRequest } from '../purchase-workflow.models';

export interface GoodsReceipt {
  id: string;
  uuid: string;
  goodsReceiptNumber: string;
  purchaseOrderId: string | null;
  supplierId: string;
  branchId: string;
  receiptDate: string;
  supplierChallanNo: string | null;
  supplierChallanDate: string | null;
  supplierInvoiceNo: string | null;
  supplierInvoiceDate: string | null;
  vehicleNumber: string | null;
  temperatureRecorded: number | null;
  isColdChainMaintained: boolean;
  status: string;
  isBilled: boolean;
  remarks: string | null;
  receivedByEmployeeId: string;
  inspectedByEmployeeId: string | null;
  inspectedAt: string | null;
  version: string;
}

export interface CreateGoodsReceiptRequest {
  branchId: string;
  supplierId: string;
  purchaseOrderId?: string;
  receiptDate: string;
  receivedByEmployeeId: string;
  supplierChallanNo?: string;
  supplierChallanDate?: string;
  supplierInvoiceNo?: string;
  supplierInvoiceDate?: string;
  vehicleNumber?: string;
  isColdChainMaintained?: boolean;
  remarks?: string;
}

export interface UpdateGoodsReceiptRequest {
  version: string;
  supplierId?: string;
  purchaseOrderId?: string | null;
  receiptDate?: string;
  receivedByEmployeeId?: string;
  supplierChallanNo?: string;
  supplierChallanDate?: string | null;
  supplierInvoiceNo?: string;
  supplierInvoiceDate?: string | null;
  vehicleNumber?: string;
  isColdChainMaintained?: boolean;
  remarks?: string;
}

export type GoodsReceiptWorkflowRequest = PurchaseWorkflowRequest;
