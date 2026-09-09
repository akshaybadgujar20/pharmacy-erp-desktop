import { Receipt } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/finance.util';

export interface ReceiptResponse {
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
  createdBy: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: number;
}

export function toReceiptResponse(receipt: Receipt): ReceiptResponse {
  return {
    id: receipt.id.toString(),
    uuid: receipt.uuid,
    receiptNumber: receipt.receiptNumber,
    receiptType: receipt.receiptType,
    receiptDate: receipt.receiptDate.toString(),
    amount: serializeDecimal(receipt.amount),
    receiptMethod: receipt.receiptMethod,
    transactionReference: receipt.transactionReference,
    referenceType: receipt.referenceType,
    referenceId: serializeBigInt(receipt.referenceId),
    status: receipt.status,
    remarks: receipt.remarks,
    createdBy: serializeBigInt(receipt.createdBy),
    createdAt: receipt.createdAt,
    updatedAt: receipt.updatedAt,
    deletedAt: receipt.deletedAt,
    version: receipt.version,
  };
}
