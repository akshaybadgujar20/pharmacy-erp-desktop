import { GoodsReceipt } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/purchase.util';

export interface GoodsReceiptResponse {
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
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toGoodsReceiptResponse(
  receipt: GoodsReceipt,
): GoodsReceiptResponse {
  return {
    id: receipt.id.toString(),
    uuid: receipt.uuid,
    goodsReceiptNumber: receipt.goodsReceiptNumber,
    purchaseOrderId: serializeBigInt(receipt.purchaseOrderId),
    supplierId: receipt.supplierId.toString(),
    branchId: receipt.branchId.toString(),
    receiptDate: receipt.receiptDate.toString(),
    supplierChallanNo: receipt.supplierChallanNo,
    supplierChallanDate: serializeBigInt(receipt.supplierChallanDate),
    supplierInvoiceNo: receipt.supplierInvoiceNo,
    supplierInvoiceDate: serializeBigInt(receipt.supplierInvoiceDate),
    vehicleNumber: receipt.vehicleNumber,
    temperatureRecorded: serializeDecimal(receipt.temperatureRecorded),
    isColdChainMaintained: receipt.isColdChainMaintained,
    status: receipt.status,
    isBilled: receipt.isBilled,
    remarks: receipt.remarks,
    receivedByEmployeeId: receipt.receivedByEmployeeId.toString(),
    inspectedByEmployeeId: serializeBigInt(receipt.inspectedByEmployeeId),
    inspectedAt: serializeBigInt(receipt.inspectedAt),
    createdAt: receipt.createdAt,
    updatedAt: receipt.updatedAt,
    deletedAt: receipt.deletedAt,
    version: receipt.version.toString(),
  };
}
