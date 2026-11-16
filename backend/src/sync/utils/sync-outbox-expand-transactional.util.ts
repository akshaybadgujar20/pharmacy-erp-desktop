import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { serializeRowForSync } from './sync-serialize.util';

function attachUuids(
  row: Record<string, unknown>,
  pairs: Array<[string, string | undefined]>,
): Record<string, unknown> {
  const data = serializeRowForSync(row);
  for (const [key, uuid] of pairs) {
    if (uuid) {
      data[key] = uuid;
    }
  }
  return data;
}

export async function expandStockRow(
  tx: TxClient,
  uuid: string,
): Promise<Record<string, unknown> | null> {
  const row = await tx.stock.findFirst({
    where: { uuid },
    include: { branch: true, batch: true },
  });
  if (!row) {
    return null;
  }
  return attachUuids(row as unknown as Record<string, unknown>, [
    ['branchUuid', row.branch.uuid],
    ['batchUuid', row.batch.uuid],
  ]);
}

export async function expandBatchRow(
  tx: TxClient,
  uuid: string,
): Promise<Record<string, unknown> | null> {
  const row = await tx.batch.findFirst({
    where: { uuid },
    include: { medicine: true },
  });
  if (!row) {
    return null;
  }
  return attachUuids(row as unknown as Record<string, unknown>, [
    ['medicineUuid', row.medicine.uuid],
  ]);
}

export async function expandStockMovementRow(
  tx: TxClient,
  uuid: string,
): Promise<Record<string, unknown> | null> {
  const row = await tx.stockMovement.findFirst({
    where: { uuid },
    include: { branch: true, medicine: true, batch: true },
  });
  if (!row) {
    return null;
  }
  return attachUuids(row as unknown as Record<string, unknown>, [
    ['branchUuid', row.branch.uuid],
    ['medicineUuid', row.medicine.uuid],
    ['batchUuid', row.batch.uuid],
  ]);
}

function serializeDocumentLines(
  items: Array<Record<string, unknown>>,
  extra: (item: Record<string, unknown>) => Record<string, unknown>,
): unknown[] {
  return items.map((item) => ({
    ...serializeRowForSync(item),
    entityUuid: item.uuid,
    ...extra(item),
  }));
}

export async function expandPurchaseOrderRow(
  tx: TxClient,
  uuid: string,
): Promise<Record<string, unknown> | null> {
  const row = await tx.purchaseOrder.findFirst({
    where: { uuid },
    include: {
      supplier: true,
      branch: true,
      items: { include: { medicine: true, unit: true } },
    },
  });
  if (!row) {
    return null;
  }
  const data = attachUuids(row as unknown as Record<string, unknown>, [
    ['supplierUuid', row.supplier.uuid],
    ['branchUuid', row.branch.uuid],
  ]);
  data.lines = serializeDocumentLines(
    row.items as unknown as Array<Record<string, unknown>>,
    (item) => {
      const i = item as {
        medicine?: { uuid: string };
        unit?: { uuid: string };
      };
      return {
        medicineUuid: i.medicine?.uuid,
        unitUuid: i.unit?.uuid,
        purchaseOrderUuid: row.uuid,
      };
    },
  );
  return data;
}

export async function expandSalesInvoiceRow(
  tx: TxClient,
  uuid: string,
): Promise<Record<string, unknown> | null> {
  const row = await tx.salesInvoice.findFirst({
    where: { uuid },
    include: {
      branch: true,
      customer: true,
      prescription: true,
      items: { include: { medicine: true, batch: true, unit: true } },
    },
  });
  if (!row) {
    return null;
  }
  const data = attachUuids(row as unknown as Record<string, unknown>, [
    ['branchUuid', row.branch.uuid],
    ['customerUuid', row.customer?.uuid],
    ['prescriptionUuid', row.prescription?.uuid],
  ]);
  data.lines = serializeDocumentLines(
    row.items as unknown as Array<Record<string, unknown>>,
    (item) => {
      const i = item as {
        medicine?: { uuid: string };
        batch?: { uuid: string };
        unit?: { uuid: string };
      };
      return {
        medicineUuid: i.medicine?.uuid,
        batchUuid: i.batch?.uuid,
        unitUuid: i.unit?.uuid,
        salesInvoiceUuid: row.uuid,
      };
    },
  );
  return data;
}

export async function expandPrescriptionRow(
  tx: TxClient,
  uuid: string,
): Promise<Record<string, unknown> | null> {
  const row = await tx.prescription.findFirst({
    where: { uuid },
    include: {
      customer: true,
      doctor: true,
      branch: true,
      items: { include: { medicine: true, unit: true } },
    },
  });
  if (!row) {
    return null;
  }
  const data = attachUuids(row as unknown as Record<string, unknown>, [
    ['customerUuid', row.customer.uuid],
    ['doctorUuid', row.doctor.uuid],
    ['branchUuid', row.branch.uuid],
  ]);
  data.lines = serializeDocumentLines(
    row.items as unknown as Array<Record<string, unknown>>,
    (item) => {
      const i = item as {
        medicine?: { uuid: string };
        unit?: { uuid: string };
      };
      return {
        medicineUuid: i.medicine?.uuid,
        unitUuid: i.unit?.uuid,
        prescriptionUuid: row.uuid,
      };
    },
  );
  return data;
}

export async function expandPriceListRow(
  tx: TxClient,
  uuid: string,
): Promise<Record<string, unknown> | null> {
  const row = await tx.priceList.findFirst({
    where: { uuid },
    include: {
      branch: true,
      items: { include: { medicine: true, tax: true } },
    },
  });
  if (!row) {
    return null;
  }
  const data = attachUuids(row as unknown as Record<string, unknown>, [
    ['branchUuid', row.branch?.uuid],
  ]);
  data.lines = serializeDocumentLines(
    row.items as unknown as Array<Record<string, unknown>>,
    (item) => {
      const i = item as {
        medicine?: { uuid: string };
        tax?: { uuid: string } | null;
      };
      return {
        medicineUuid: i.medicine?.uuid,
        taxUuid: i.tax?.uuid,
        priceListUuid: row.uuid,
      };
    },
  );
  return data;
}

export async function expandGoodsReceiptRow(
  tx: TxClient,
  uuid: string,
): Promise<Record<string, unknown> | null> {
  const row = await tx.goodsReceipt.findFirst({
    where: { uuid },
    include: {
      supplier: true,
      branch: true,
      purchaseOrder: true,
      items: { include: { medicine: true, batch: true, unit: true } },
    },
  });
  if (!row) {
    return null;
  }
  const data = attachUuids(row as unknown as Record<string, unknown>, [
    ['supplierUuid', row.supplier.uuid],
    ['branchUuid', row.branch.uuid],
    ['purchaseOrderUuid', row.purchaseOrder?.uuid],
  ]);
  data.lines = serializeDocumentLines(
    row.items as unknown as Array<Record<string, unknown>>,
    (item) => {
      const i = item as {
        medicine?: { uuid: string };
        batch?: { uuid: string } | null;
        unit?: { uuid: string };
      };
      return {
        medicineUuid: i.medicine?.uuid,
        batchUuid: i.batch?.uuid,
        unitUuid: i.unit?.uuid,
        goodsReceiptUuid: row.uuid,
      };
    },
  );
  return data;
}

export function expandBranchChildRow(
  row: Record<string, unknown>,
  branch: { uuid: string } | null | undefined,
): Record<string, unknown> {
  const data = serializeRowForSync(row);
  if (branch) {
    data.branchUuid = branch.uuid;
  }
  return data;
}
