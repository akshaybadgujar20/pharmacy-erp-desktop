import { SalesPayment } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/sales.util';

export interface SalesPaymentResponse {
  id: string;
  uuid: string;
  paymentNumber: string;
  salesInvoiceId: string;
  branchId: string;
  paymentDate: string;
  paymentMethod: string;
  paymentAmount: number | null;
  tenderedAmount: number | null;
  changeReturned: number | null;
  transactionReference: string | null;
  cardLast4Digits: string | null;
  cardType: string | null;
  posTerminalId: string | null;
  bankName: string | null;
  chequeNumber: string | null;
  chequeDate: string | null;
  status: string;
  remarks: string | null;
  createdBy: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: number;
}

export function toSalesPaymentResponse(
  payment: SalesPayment,
): SalesPaymentResponse {
  return {
    id: payment.id.toString(),
    uuid: payment.uuid,
    paymentNumber: payment.paymentNumber,
    salesInvoiceId: payment.salesInvoiceId.toString(),
    branchId: payment.branchId.toString(),
    paymentDate: payment.paymentDate.toString(),
    paymentMethod: payment.paymentMethod,
    paymentAmount: serializeDecimal(payment.paymentAmount),
    tenderedAmount: serializeDecimal(payment.tenderedAmount),
    changeReturned: serializeDecimal(payment.changeReturned),
    transactionReference: payment.transactionReference,
    cardLast4Digits: payment.cardLast4Digits,
    cardType: payment.cardType,
    posTerminalId: payment.posTerminalId,
    bankName: payment.bankName,
    chequeNumber: payment.chequeNumber,
    chequeDate: serializeBigInt(payment.chequeDate),
    status: payment.status,
    remarks: payment.remarks,
    createdBy: serializeBigInt(payment.createdBy),
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    deletedAt: payment.deletedAt,
    version: payment.version,
  };
}
