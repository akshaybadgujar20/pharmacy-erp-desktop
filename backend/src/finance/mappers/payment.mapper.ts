import { Payment } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/finance.util';

export interface PaymentResponse {
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
  createdBy: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: number;
}

export function toPaymentResponse(payment: Payment): PaymentResponse {
  return {
    id: payment.id.toString(),
    uuid: payment.uuid,
    paymentNumber: payment.paymentNumber,
    paymentType: payment.paymentType,
    paymentDate: payment.paymentDate.toString(),
    amount: serializeDecimal(payment.amount),
    paymentMethod: payment.paymentMethod,
    transactionReference: payment.transactionReference,
    referenceType: payment.referenceType,
    referenceId: serializeBigInt(payment.referenceId),
    status: payment.status,
    remarks: payment.remarks,
    createdBy: serializeBigInt(payment.createdBy),
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    deletedAt: payment.deletedAt,
    version: payment.version,
  };
}
