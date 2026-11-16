import { Prisma } from '@prisma/client';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import type { SyncCloudPullRecord } from '../cloud/sync-cloud.contract';
import { isSyncPhase1EntityType } from '../constants/sync-phase1-entity-types';
import {
  applyArea,
  applyCity,
  applyDoctor,
  applyEmployee,
  applyManufacturer,
  applyMedicineGeneric,
  applyMedicineSalt,
  applyPartyAddress,
  applyPartyContact,
  applyPartyRole,
  applySaltComposition,
  applyState,
} from './party-geo.apply';
import {
  asBool,
  asOptionalBigInt,
  asOptionalString,
  asString,
  extractApplyData,
  recordEntityUuid,
  serverVersionFromRecord,
  SyncApplyConflictError,
  SyncApplyError,
} from './sync-apply.util';

function assertServerWins(
  existingVersion: bigint,
  serverVersion: bigint,
): void {
  if (existingVersion > serverVersion) {
    throw new SyncApplyConflictError(
      `Local version ${existingVersion} is newer than server ${serverVersion}`,
    );
  }
}

async function resolvePartyId(
  tx: TxClient,
  data: Record<string, unknown>,
): Promise<bigint> {
  const partyId = asOptionalBigInt(data.partyId);
  if (partyId != null) {
    return partyId;
  }
  const partyUuid = asOptionalString(data.partyUuid);
  if (partyUuid) {
    const party = await tx.party.findFirst({ where: { uuid: partyUuid } });
    if (party) {
      return party.id;
    }
    throw new SyncApplyError(`Party not found for uuid ${partyUuid}`);
  }
  throw new SyncApplyError('partyId or partyUuid is required');
}

async function applyDelete(
  tx: TxClient,
  delegate: {
    findFirst: (args: {
      where: { uuid: string };
    }) => Promise<{ id: bigint } | null>;
    update: (args: {
      where: { id: bigint };
      data: { deletedAt: bigint; version: { increment: number } };
    }) => Promise<unknown>;
  },
  uuid: string,
): Promise<void> {
  const existing = await delegate.findFirst({ where: { uuid } });
  if (!existing) {
    return;
  }
  const now = BigInt(Date.now());
  await delegate.update({
    where: { id: existing.id },
    data: { deletedAt: now, version: { increment: 1 } },
  });
}

async function applyParty(tx: TxClient, record: SyncCloudPullRecord) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());

  if (record.operation === OutboxOperation.DELETE) {
    await applyDelete(tx, tx.party, uuid);
    return;
  }

  const existing = await tx.party.findFirst({ where: { uuid } });
  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.party.update({
      where: { id: existing.id },
      data: {
        partyType: asOptionalString(data.partyType) ?? existing.partyType,
        displayName: asOptionalString(data.displayName) ?? existing.displayName,
        firstName: asOptionalString(data.firstName),
        middleName: asOptionalString(data.middleName),
        lastName: asOptionalString(data.lastName),
        organizationName: asOptionalString(data.organizationName),
        isActive: asBool(data.isActive, existing.isActive),
        updatedAt: now,
        version: serverVersion,
      },
    });
    return;
  }

  await tx.party.create({
    data: {
      uuid,
      partyType: asString(data.partyType, 'partyType'),
      displayName: asString(data.displayName, 'displayName'),
      firstName: asOptionalString(data.firstName),
      middleName: asOptionalString(data.middleName),
      lastName: asOptionalString(data.lastName),
      organizationName: asOptionalString(data.organizationName),
      isActive: asBool(data.isActive, true),
      createdAt: now,
      updatedAt: now,
      version: serverVersion,
    },
  });
}

async function applyCustomer(tx: TxClient, record: SyncCloudPullRecord) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());

  if (record.operation === OutboxOperation.DELETE) {
    await applyDelete(tx, tx.customer, uuid);
    return;
  }

  const partyId = await resolvePartyId(tx, data);
  const existing = await tx.customer.findFirst({ where: { uuid } });

  const shared = {
    customerCode: asString(data.customerCode, 'customerCode'),
    customerType: asString(data.customerType, 'customerType'),
    creditLimit: new Prisma.Decimal(
      typeof data.creditLimit === 'string' ||
        typeof data.creditLimit === 'number'
        ? String(data.creditLimit)
        : '0',
    ),
    outstandingAmount: new Prisma.Decimal(
      typeof data.outstandingAmount === 'string' ||
        typeof data.outstandingAmount === 'number'
        ? String(data.outstandingAmount)
        : '0',
    ),
    paymentTermsDays: Number(data.paymentTermsDays ?? 0),
    loyaltyPoints: Number(data.loyaltyPoints ?? 0),
    isTaxExempt: asBool(data.isTaxExempt, false),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };

  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.customer.update({
      where: { id: existing.id },
      data: shared,
    });
    return;
  }

  await tx.customer.create({
    data: {
      uuid,
      partyId,
      ...shared,
      createdAt: now,
    },
  });
}

async function applyCompany(tx: TxClient, record: SyncCloudPullRecord) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());

  if (record.operation === OutboxOperation.DELETE) {
    await applyDelete(tx, tx.company, uuid);
    return;
  }

  const existing = await tx.company.findFirst({ where: { uuid } });
  const fields = {
    companyCode: asString(data.companyCode, 'companyCode'),
    companyName: asString(data.companyName, 'companyName'),
    displayName: asString(data.displayName, 'displayName'),
    isActive: asBool(data.isActive, true),
    isDefault: asBool(data.isDefault, false),
    updatedAt: now,
    version: serverVersion,
  };

  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.company.update({ where: { id: existing.id }, data: fields });
    return;
  }

  await tx.company.create({
    data: {
      uuid,
      ...fields,
      createdAt: now,
    },
  });
}

async function applyBranch(tx: TxClient, record: SyncCloudPullRecord) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());

  if (record.operation === OutboxOperation.DELETE) {
    await applyDelete(tx, tx.branch, uuid);
    return;
  }

  let companyId = asOptionalBigInt(data.companyId);
  if (companyId == null && data.companyUuid) {
    const company = await tx.company.findFirst({
      where: { uuid: asString(data.companyUuid, 'companyUuid') },
    });
    if (!company) {
      throw new SyncApplyError('Company not found for branch apply');
    }
    companyId = company.id;
  }
  if (companyId == null) {
    throw new SyncApplyError('companyId or companyUuid is required for Branch');
  }

  const existing = await tx.branch.findFirst({ where: { uuid } });
  const fields = {
    companyId,
    branchCode: asString(data.branchCode, 'branchCode'),
    branchName: asString(data.branchName, 'branchName'),
    displayName: asString(data.displayName, 'displayName'),
    isActive: asBool(data.isActive, true),
    isHeadOffice: asBool(data.isHeadOffice, false),
    updatedAt: now,
    version: serverVersion,
  };

  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.branch.update({ where: { id: existing.id }, data: fields });
    return;
  }

  await tx.branch.create({
    data: {
      uuid,
      ...fields,
      createdAt: now,
    },
  });
}

async function applyCountry(tx: TxClient, record: SyncCloudPullRecord) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());

  if (record.operation === OutboxOperation.DELETE) {
    await applyDelete(tx, tx.country, uuid);
    return;
  }

  const existing = await tx.country.findFirst({ where: { uuid } });
  const fields = {
    countryCode: asString(data.countryCode, 'countryCode'),
    isoAlpha2: asString(data.isoAlpha2, 'isoAlpha2'),
    isoAlpha3: asString(data.isoAlpha3, 'isoAlpha3'),
    countryName: asString(data.countryName, 'countryName'),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };

  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.country.update({ where: { id: existing.id }, data: fields });
    return;
  }

  await tx.country.create({
    data: {
      uuid,
      ...fields,
      createdAt: now,
    },
  });
}

async function applySupplier(tx: TxClient, record: SyncCloudPullRecord) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());

  if (record.operation === OutboxOperation.DELETE) {
    await applyDelete(tx, tx.supplier, uuid);
    return;
  }

  const partyId = await resolvePartyId(tx, data);
  const existing = await tx.supplier.findFirst({ where: { uuid } });
  const shared = {
    supplierCode: asString(data.supplierCode, 'supplierCode'),
    supplierType: asString(data.supplierType, 'supplierType'),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };

  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.supplier.update({ where: { id: existing.id }, data: shared });
    return;
  }

  await tx.supplier.create({
    data: {
      uuid,
      partyId,
      ...shared,
      createdAt: now,
    },
  });
}

async function applyMedicine(tx: TxClient, record: SyncCloudPullRecord) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());

  if (record.operation === OutboxOperation.DELETE) {
    await applyDelete(tx, tx.medicine, uuid);
    return;
  }

  async function resolveFkId(
    idKey: string,
    uuidKey: string,
    lookup: (uuid: string) => Promise<{ id: bigint } | null>,
    label: string,
  ): Promise<bigint> {
    const direct = asOptionalBigInt(data[idKey]);
    if (direct != null) {
      return direct;
    }
    const refUuid = asOptionalString(data[uuidKey]);
    if (!refUuid) {
      throw new SyncApplyError(`${idKey} or ${uuidKey} required for Medicine`);
    }
    const row = await lookup(refUuid);
    if (!row) {
      throw new SyncApplyError(`${label} not found for ${refUuid}`);
    }
    return row.id;
  }

  const manufacturerId = await resolveFkId(
    'manufacturerId',
    'manufacturerUuid',
    (uuid) => tx.manufacturer.findFirst({ where: { uuid } }),
    'Manufacturer',
  );
  const categoryId = await resolveFkId(
    'categoryId',
    'categoryUuid',
    (uuid) => tx.medicineCategory.findFirst({ where: { uuid } }),
    'MedicineCategory',
  );
  const unitId = await resolveFkId(
    'unitId',
    'unitUuid',
    (uuid) => tx.unitOfMeasure.findFirst({ where: { uuid } }),
    'UnitOfMeasure',
  );

  let scheduleId: bigint | null = null;
  const scheduleIdDirect = asOptionalBigInt(data.scheduleId);
  if (scheduleIdDirect != null) {
    scheduleId = scheduleIdDirect;
  } else if (data.scheduleUuid) {
    const schedule = await tx.medicineSchedule.findFirst({
      where: { uuid: asString(data.scheduleUuid, 'scheduleUuid') },
    });
    scheduleId = schedule?.id ?? null;
  }

  const existing = await tx.medicine.findFirst({ where: { uuid } });
  const fields = {
    medicineCode: asString(data.medicineCode, 'medicineCode'),
    medicineName: asString(data.medicineName, 'medicineName'),
    manufacturerId,
    categoryId,
    unitId,
    scheduleId,
    dosageForm: asString(data.dosageForm, 'dosageForm'),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };

  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.medicine.update({ where: { id: existing.id }, data: fields });
    return;
  }

  await tx.medicine.create({
    data: {
      uuid,
      ...fields,
      createdAt: now,
    },
  });
}

async function applyCodeNameMaster(
  tx: TxClient,
  record: SyncCloudPullRecord,
  options: {
    entityLabel: string;
    codeField: string;
    nameField: string;
    findFirst: (where: {
      uuid: string;
    }) => Promise<{ id: bigint; version: bigint } | null>;
    create: (data: Record<string, unknown>) => Promise<unknown>;
    update: (id: bigint, data: Record<string, unknown>) => Promise<unknown>;
  },
): Promise<void> {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());

  if (record.operation === OutboxOperation.DELETE) {
    const existing = await options.findFirst({ uuid });
    if (existing) {
      await options.update(existing.id, {
        deletedAt: now,
        version: { increment: 1 },
      });
    }
    return;
  }

  const code = asString(data[options.codeField], options.codeField);
  const name = asString(data[options.nameField], options.nameField);
  const existing = await options.findFirst({ uuid });
  const payload = {
    [options.codeField]: code,
    [options.nameField]: name,
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };

  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await options.update(existing.id, payload);
    return;
  }

  await options.create({
    uuid,
    ...payload,
    createdAt: now,
  });
}

export async function applyPhase1Record(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  if (!isSyncPhase1EntityType(record.entityType)) {
    throw new SyncApplyError(
      `Entity type not in phase 1: ${record.entityType}`,
    );
  }

  switch (record.entityType) {
    case OutboxEntityType.PARTY:
      await applyParty(tx, record);
      return;
    case OutboxEntityType.CUSTOMER:
      await applyCustomer(tx, record);
      return;
    case OutboxEntityType.SUPPLIER:
      await applySupplier(tx, record);
      return;
    case OutboxEntityType.COMPANY:
      await applyCompany(tx, record);
      return;
    case OutboxEntityType.BRANCH:
      await applyBranch(tx, record);
      return;
    case OutboxEntityType.COUNTRY:
      await applyCountry(tx, record);
      return;
    case OutboxEntityType.MEDICINE:
      await applyMedicine(tx, record);
      return;
    case OutboxEntityType.UNIT_OF_MEASURE:
      await applyCodeNameMaster(tx, record, {
        entityLabel: 'UnitOfMeasure',
        codeField: 'unitCode',
        nameField: 'unitName',
        findFirst: (where) => tx.unitOfMeasure.findFirst({ where }),
        create: (data) => tx.unitOfMeasure.create({ data: data as never }),
        update: (id, data) =>
          tx.unitOfMeasure.update({ where: { id }, data: data as never }),
      });
      return;
    case OutboxEntityType.MEDICINE_CATEGORY:
      await applyCodeNameMaster(tx, record, {
        entityLabel: 'MedicineCategory',
        codeField: 'categoryCode',
        nameField: 'categoryName',
        findFirst: (where) => tx.medicineCategory.findFirst({ where }),
        create: (data) => tx.medicineCategory.create({ data: data as never }),
        update: (id, data) =>
          tx.medicineCategory.update({ where: { id }, data: data as never }),
      });
      return;
    case OutboxEntityType.MEDICINE_SCHEDULE:
      await applyCodeNameMaster(tx, record, {
        entityLabel: 'MedicineSchedule',
        codeField: 'scheduleCode',
        nameField: 'scheduleName',
        findFirst: (where) => tx.medicineSchedule.findFirst({ where }),
        create: (data) => tx.medicineSchedule.create({ data: data as never }),
        update: (id, data) =>
          tx.medicineSchedule.update({ where: { id }, data: data as never }),
      });
      return;
    case OutboxEntityType.PARTY_ROLE:
      await applyPartyRole(tx, record);
      return;
    case OutboxEntityType.PARTY_ADDRESS:
      await applyPartyAddress(tx, record);
      return;
    case OutboxEntityType.PARTY_CONTACT:
      await applyPartyContact(tx, record);
      return;
    case OutboxEntityType.DOCTOR:
      await applyDoctor(tx, record);
      return;
    case OutboxEntityType.EMPLOYEE:
      await applyEmployee(tx, record);
      return;
    case OutboxEntityType.MANUFACTURER:
      await applyManufacturer(tx, record);
      return;
    case OutboxEntityType.STATE:
      await applyState(tx, record);
      return;
    case OutboxEntityType.CITY:
      await applyCity(tx, record);
      return;
    case OutboxEntityType.AREA:
      await applyArea(tx, record);
      return;
    case OutboxEntityType.MEDICINE_GENERIC:
      await applyMedicineGeneric(tx, record);
      return;
    case OutboxEntityType.SALT_COMPOSITION:
      await applySaltComposition(tx, record);
      return;
    case OutboxEntityType.MEDICINE_SALT:
      await applyMedicineSalt(tx, record);
      return;
    default:
      throw new SyncApplyError(
        `Apply handler not implemented for ${record.entityType}`,
      );
  }
}
