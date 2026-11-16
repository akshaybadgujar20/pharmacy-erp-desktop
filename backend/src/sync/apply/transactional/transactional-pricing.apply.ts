import { OutboxEntityType } from '../../../persistence/outbox/entity-type.constants';
import type { TxClient } from '../../../persistence/prisma/prisma-tx.type';
import type { SyncCloudPullRecord } from '../../cloud/sync-cloud.contract';
import {
  extractApplyData,
  recordEntityUuid,
  serverVersionFromRecord,
  SyncApplyError,
  asBigInt,
  asBool,
  asOptionalString,
  asString,
} from '../sync-apply.util';
import {
  optionalIdByUuid,
  resolveIdField,
  resolveOptionalIdField,
  stripIncomingSyncData,
  txBranchLookup,
  txCustomerLookup,
  txMedicineCategoryLookup,
  txMedicineLookup,
  txPriceListLookup,
  txTaxLookup,
} from '../sync-fk-resolve.util';
import {
  applyEmbeddedLines,
  applyServerWin,
  asDecimal,
  asOptionalDecimal,
  asInt,
} from './transactional-apply-shared';

export async function applyPricingTransactional(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  switch (record.entityType) {
    case OutboxEntityType.TAX:
      await applyTax(tx, record);
      return;
    case OutboxEntityType.PRICE_LIST:
      await applyPriceList(tx, record);
      return;
    case OutboxEntityType.PRICE_LIST_ITEM:
      await applyPriceListItem(tx, record);
      return;
    case OutboxEntityType.DISCOUNT_RULE:
      await applyDiscountRule(tx, record);
      return;
    default:
      throw new SyncApplyError(
        `Pricing apply does not handle ${record.entityType}`,
      );
  }
}

async function applyTax(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyServerWin(
    tx,
    record,
    async (uuid) => {
      const row = await tx.tax.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      return {
        uuid,
        taxCode: asString(base.taxCode, 'taxCode'),
        taxName: asString(base.taxName, 'taxName'),
        taxType: asString(base.taxType, 'taxType'),
        taxRate: asDecimal(base.taxRate),
        effectiveFrom: asBigInt(base.effectiveFrom, 'effectiveFrom'),
        effectiveTo: base.effectiveTo
          ? asBigInt(base.effectiveTo, 'effectiveTo')
          : null,
        isActive: asBool(base.isActive, true),
        description: asOptionalString(base.description),
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    (data, serverVersion) => ({
      taxCode: asString(data.taxCode, 'taxCode'),
      taxName: asString(data.taxName, 'taxName'),
      taxType: asString(data.taxType, 'taxType'),
      taxRate: asDecimal(data.taxRate),
      effectiveFrom: asBigInt(data.effectiveFrom, 'effectiveFrom'),
      effectiveTo: data.effectiveTo
        ? asBigInt(data.effectiveTo, 'effectiveTo')
        : null,
      isActive: asBool(data.isActive, true),
      description: asOptionalString(data.description),
      version: serverVersion,
      updatedAt: BigInt(Date.now()),
    }),
    (row) => tx.tax.create({ data: row as never }),
    (id, row) => tx.tax.update({ where: { id }, data: row as never }),
  );
}

async function applyPriceList(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyServerWin(
    tx,
    record,
    async (uuid) => {
      const row = await tx.priceList.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const branchId = await resolveOptionalIdField(
        txBranchLookup(tx),
        base,
        'branchId',
        'branchUuid',
        'branch',
      );
      return {
        uuid,
        priceListCode: asString(base.priceListCode, 'priceListCode'),
        priceListName: asString(base.priceListName, 'priceListName'),
        branchId,
        priceListType: asString(base.priceListType, 'priceListType'),
        effectiveFrom: asBigInt(base.effectiveFrom, 'effectiveFrom'),
        effectiveTo: base.effectiveTo
          ? asBigInt(base.effectiveTo, 'effectiveTo')
          : null,
        isDefault: asBool(base.isDefault, false),
        isActive: asBool(base.isActive, true),
        remarks: asOptionalString(base.remarks),
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    async (data, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const branchId = await resolveOptionalIdField(
        txBranchLookup(tx),
        base,
        'branchId',
        'branchUuid',
        'branch',
      );
      return {
        priceListCode: asString(base.priceListCode, 'priceListCode'),
        priceListName: asString(base.priceListName, 'priceListName'),
        branchId,
        priceListType: asString(base.priceListType, 'priceListType'),
        effectiveFrom: asBigInt(base.effectiveFrom, 'effectiveFrom'),
        effectiveTo: base.effectiveTo
          ? asBigInt(base.effectiveTo, 'effectiveTo')
          : null,
        isDefault: asBool(base.isDefault, false),
        isActive: asBool(base.isActive, true),
        remarks: asOptionalString(base.remarks),
        version: serverVersion,
        updatedAt: BigInt(Date.now()),
      };
    },
    (row) => tx.priceList.create({ data: row as never }),
    (id, row) => tx.priceList.update({ where: { id }, data: row as never }),
    async (data) => {
      await applyEmbeddedLines(tx, data, '', async (ltx, line) => {
        await upsertPriceListItemLine(ltx, line);
      });
    },
  );
}

async function upsertPriceListItemLine(
  tx: TxClient,
  line: Record<string, unknown>,
): Promise<void> {
  const uuid = asString(line.uuid ?? line.entityUuid, 'uuid');
  const priceListId = await resolveIdField(
    txPriceListLookup(tx),
    line,
    'priceListId',
    'priceListUuid',
    'priceList',
    true,
  );
  const medicineId = await resolveIdField(
    txMedicineLookup(tx),
    line,
    'medicineId',
    'medicineUuid',
    'medicine',
    true,
  );
  const taxId = await resolveOptionalIdField(
    txTaxLookup(tx),
    line,
    'taxId',
    'taxUuid',
    'tax',
  );
  const serverVersion = line.version ? asBigInt(line.version, 'version') : 1n;
  const existing = await tx.priceListItem.findFirst({ where: { uuid } });
  const payload = {
    priceListId: priceListId!,
    medicineId: medicineId!,
    sellingPrice: asDecimal(line.sellingPrice),
    mrp: asDecimal(line.mrp),
    minimumSellingPrice: asOptionalDecimal(line.minimumSellingPrice),
    discountPercent: asOptionalDecimal(line.discountPercent),
    taxId,
    effectiveFrom: asBigInt(line.effectiveFrom, 'effectiveFrom'),
    effectiveTo: line.effectiveTo
      ? asBigInt(line.effectiveTo, 'effectiveTo')
      : null,
    isActive: asBool(line.isActive, true),
    remarks: asOptionalString(line.remarks),
    version: serverVersion,
    updatedAt: BigInt(Date.now()),
  };
  if (existing) {
    await tx.priceListItem.update({
      where: { id: existing.id },
      data: payload as never,
    });
    return;
  }
  await tx.priceListItem.create({
    data: {
      uuid,
      ...payload,
      createdAt: BigInt(Date.now()),
    } as never,
  });
}

async function applyPriceListItem(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  await upsertPriceListItemLine(tx, { ...data, uuid, version: serverVersion });
}

async function applyDiscountRule(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyServerWin(
    tx,
    record,
    async (uuid) => {
      const row = await tx.discountRule.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const medicineId = await resolveOptionalIdField(
        txMedicineLookup(tx),
        base,
        'medicineId',
        'medicineUuid',
        'medicine',
      );
      const categoryId = await resolveOptionalIdField(
        txMedicineCategoryLookup(tx),
        base,
        'categoryId',
        'categoryUuid',
        'category',
      );
      const customerId = await resolveOptionalIdField(
        txCustomerLookup(tx),
        base,
        'customerId',
        'customerUuid',
        'customer',
      );
      const priceListId = await resolveOptionalIdField(
        txPriceListLookup(tx),
        base,
        'priceListId',
        'priceListUuid',
        'priceList',
      );
      return {
        uuid,
        ruleCode: asString(base.ruleCode, 'ruleCode'),
        ruleName: asString(base.ruleName, 'ruleName'),
        discountType: asString(base.discountType, 'discountType'),
        discountValue: asDecimal(base.discountValue),
        appliesTo: asString(base.appliesTo, 'appliesTo'),
        medicineId,
        categoryId,
        customerId,
        priceListId,
        minimumQuantity: asOptionalDecimal(base.minimumQuantity),
        minimumAmount: asOptionalDecimal(base.minimumAmount),
        priority: asInt(base.priority, 'priority'),
        effectiveFrom: asBigInt(base.effectiveFrom, 'effectiveFrom'),
        effectiveTo: base.effectiveTo
          ? asBigInt(base.effectiveTo, 'effectiveTo')
          : null,
        isActive: asBool(base.isActive, true),
        remarks: asOptionalString(base.remarks),
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    async (data, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const medicineId = await optionalIdByUuid(
        txMedicineLookup(tx),
        base.medicineUuid,
        'medicine',
      );
      const categoryId = base.categoryUuid
        ? await optionalIdByUuid(
            txMedicineCategoryLookup(tx),
            base.categoryUuid,
            'category',
          )
        : null;
      const customerId = base.customerUuid
        ? await optionalIdByUuid(
            txCustomerLookup(tx),
            base.customerUuid,
            'customer',
          )
        : null;
      const priceListId = base.priceListUuid
        ? await optionalIdByUuid(
            txPriceListLookup(tx),
            base.priceListUuid,
            'priceList',
          )
        : null;
      return {
        ruleCode: asString(base.ruleCode, 'ruleCode'),
        ruleName: asString(base.ruleName, 'ruleName'),
        discountType: asString(base.discountType, 'discountType'),
        discountValue: asDecimal(base.discountValue),
        appliesTo: asString(base.appliesTo, 'appliesTo'),
        medicineId,
        categoryId,
        customerId,
        priceListId,
        minimumQuantity: asOptionalDecimal(base.minimumQuantity),
        minimumAmount: asOptionalDecimal(base.minimumAmount),
        priority: asInt(base.priority, 'priority'),
        effectiveFrom: asBigInt(base.effectiveFrom, 'effectiveFrom'),
        effectiveTo: base.effectiveTo
          ? asBigInt(base.effectiveTo, 'effectiveTo')
          : null,
        isActive: asBool(base.isActive, true),
        remarks: asOptionalString(base.remarks),
        version: serverVersion,
        updatedAt: BigInt(Date.now()),
      };
    },
    (row) => tx.discountRule.create({ data: row as never }),
    (id, row) => tx.discountRule.update({ where: { id }, data: row as never }),
  );
}
