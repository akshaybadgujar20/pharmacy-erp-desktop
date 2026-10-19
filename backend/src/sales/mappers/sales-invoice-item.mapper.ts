import { Medicine, MedicineSchedule, SalesInvoiceItem } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/sales.util';

export type SalesInvoiceItemWithMedicine = SalesInvoiceItem & {
  medicine?: Pick<Medicine, 'requiresPrescription'> & {
    schedule?: Pick<
      MedicineSchedule,
      'scheduleCode' | 'controlledSubstance'
    > | null;
  };
};

export interface SalesInvoiceItemResponse {
  id: string;
  uuid: string;
  salesInvoiceId: string;
  medicineId: string;
  batchId: string;
  unitId: string;
  lineNumber: number;
  soldQuantity: number | null;
  mrp: number | null;
  unitPrice: number | null;
  purchaseRate: number | null;
  conversionFactor: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  taxPercent: number | null;
  taxAmount: number | null;
  lineAmount: number | null;
  taxId: string | null;
  remarks: string | null;
  scheduleCode: string | null;
  requiresPrescription: boolean;
  controlledSubstance: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toSalesInvoiceItemResponse(
  item: SalesInvoiceItemWithMedicine,
): SalesInvoiceItemResponse {
  return {
    id: item.id.toString(),
    uuid: item.uuid,
    salesInvoiceId: item.salesInvoiceId.toString(),
    medicineId: item.medicineId.toString(),
    batchId: item.batchId.toString(),
    unitId: item.unitId.toString(),
    lineNumber: item.lineNumber,
    soldQuantity: serializeDecimal(item.soldQuantity),
    mrp: serializeDecimal(item.mrp),
    unitPrice: serializeDecimal(item.unitPrice),
    purchaseRate: serializeDecimal(item.purchaseRate),
    conversionFactor: serializeDecimal(item.conversionFactor),
    discountPercent: serializeDecimal(item.discountPercent),
    discountAmount: serializeDecimal(item.discountAmount),
    taxPercent: serializeDecimal(item.taxPercent),
    taxAmount: serializeDecimal(item.taxAmount),
    lineAmount: serializeDecimal(item.lineAmount),
    taxId: serializeBigInt(item.taxId),
    remarks: item.remarks,
    scheduleCode: item.medicine?.schedule?.scheduleCode ?? null,
    requiresPrescription: item.medicine?.requiresPrescription ?? false,
    controlledSubstance: item.medicine?.schedule?.controlledSubstance ?? false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    version: item.version.toString(),
  };
}
