import { Prisma } from '@prisma/client';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import type { SyncCloudPullRecord } from '../cloud/sync-cloud.contract';
import {
  asBool,
  asOptionalString,
  asString,
  extractApplyData,
  recordEntityUuid,
  serverVersionFromRecord,
  SyncApplyError,
} from './sync-apply.util';

export function assertServerWins(
  existingVersion: bigint,
  serverVersion: bigint,
): void {
  if (existingVersion > serverVersion) {
    throw new SyncApplyError('Local version is newer than server');
  }
}

async function resolvePartyId(
  tx: TxClient,
  data: Record<string, unknown>,
): Promise<bigint> {
  const partyUuid = asOptionalString(data.partyUuid);
  if (partyUuid) {
    const party = await tx.party.findFirst({ where: { uuid: partyUuid } });
    if (party) {
      return party.id;
    }
  }
  throw new SyncApplyError('partyUuid is required');
}

async function resolveCountryId(
  tx: TxClient,
  data: Record<string, unknown>,
): Promise<bigint> {
  const countryUuid = asOptionalString(data.countryUuid);
  if (countryUuid) {
    const country = await tx.country.findFirst({
      where: { uuid: countryUuid },
    });
    if (country) {
      return country.id;
    }
  }
  throw new SyncApplyError('countryUuid is required');
}

async function resolveStateId(
  tx: TxClient,
  data: Record<string, unknown>,
): Promise<bigint> {
  const stateUuid = asOptionalString(data.stateUuid);
  if (stateUuid) {
    const state = await tx.state.findFirst({ where: { uuid: stateUuid } });
    if (state) {
      return state.id;
    }
  }
  throw new SyncApplyError('stateUuid is required');
}

async function resolveCityId(
  tx: TxClient,
  data: Record<string, unknown>,
): Promise<bigint> {
  const cityUuid = asOptionalString(data.cityUuid);
  if (cityUuid) {
    const city = await tx.city.findFirst({ where: { uuid: cityUuid } });
    if (city) {
      return city.id;
    }
  }
  throw new SyncApplyError('cityUuid is required');
}

export async function applyPartyRole(
  tx: TxClient,
  record: SyncCloudPullRecord,
) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());
  const partyId = await resolvePartyId(tx, data);
  const existing = await tx.partyRole.findFirst({ where: { uuid } });
  const fields = {
    partyId,
    roleType: asString(data.roleType, 'roleType'),
    isPrimary: asBool(data.isPrimary, false),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };
  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.partyRole.update({ where: { id: existing.id }, data: fields });
    return;
  }
  await tx.partyRole.create({ data: { uuid, ...fields, createdAt: now } });
}

export async function applyPartyAddress(
  tx: TxClient,
  record: SyncCloudPullRecord,
) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());
  const partyId = await resolvePartyId(tx, data);
  const existing = await tx.partyAddress.findFirst({ where: { uuid } });
  const fields = {
    partyId,
    addressType: asString(data.addressType, 'addressType'),
    addressLine1: asString(data.addressLine1, 'addressLine1'),
    addressLine2: asOptionalString(data.addressLine2),
    isDefault: asBool(data.isDefault, false),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };
  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.partyAddress.update({ where: { id: existing.id }, data: fields });
    return;
  }
  await tx.partyAddress.create({ data: { uuid, ...fields, createdAt: now } });
}

export async function applyPartyContact(
  tx: TxClient,
  record: SyncCloudPullRecord,
) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());
  const partyId = await resolvePartyId(tx, data);
  const existing = await tx.partyContact.findFirst({ where: { uuid } });
  const fields = {
    partyId,
    contactType: asString(data.contactType, 'contactType'),
    contactValue: asString(data.contactValue, 'contactValue'),
    isPrimary: asBool(data.isPrimary, false),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };
  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.partyContact.update({ where: { id: existing.id }, data: fields });
    return;
  }
  await tx.partyContact.create({ data: { uuid, ...fields, createdAt: now } });
}

export async function applyDoctor(tx: TxClient, record: SyncCloudPullRecord) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());
  const partyId = await resolvePartyId(tx, data);
  const existing = await tx.doctor.findFirst({ where: { uuid } });
  const fields = {
    partyId,
    doctorCode: asString(data.doctorCode, 'doctorCode'),
    registrationNumber: asString(data.registrationNumber, 'registrationNumber'),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };
  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.doctor.update({ where: { id: existing.id }, data: fields });
    return;
  }
  await tx.doctor.create({ data: { uuid, ...fields, createdAt: now } });
}

export async function applyEmployee(tx: TxClient, record: SyncCloudPullRecord) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());
  const partyId = await resolvePartyId(tx, data);
  const existing = await tx.employee.findFirst({ where: { uuid } });
  const fields = {
    partyId,
    employeeCode: asString(data.employeeCode, 'employeeCode'),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };
  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.employee.update({ where: { id: existing.id }, data: fields });
    return;
  }
  await tx.employee.create({ data: { uuid, ...fields, createdAt: now } });
}

export async function applyManufacturer(
  tx: TxClient,
  record: SyncCloudPullRecord,
) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());
  const partyId = await resolvePartyId(tx, data);
  const existing = await tx.manufacturer.findFirst({ where: { uuid } });
  const fields = {
    partyId,
    manufacturerCode: asString(data.manufacturerCode, 'manufacturerCode'),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };
  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.manufacturer.update({ where: { id: existing.id }, data: fields });
    return;
  }
  await tx.manufacturer.create({ data: { uuid, ...fields, createdAt: now } });
}

export async function applyState(tx: TxClient, record: SyncCloudPullRecord) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());
  const countryId = await resolveCountryId(tx, data);
  const existing = await tx.state.findFirst({ where: { uuid } });
  const fields = {
    countryId,
    stateCode: asString(data.stateCode, 'stateCode'),
    stateName: asString(data.stateName, 'stateName'),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };
  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.state.update({ where: { id: existing.id }, data: fields });
    return;
  }
  await tx.state.create({ data: { uuid, ...fields, createdAt: now } });
}

export async function applyCity(tx: TxClient, record: SyncCloudPullRecord) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());
  const stateId = await resolveStateId(tx, data);
  const existing = await tx.city.findFirst({ where: { uuid } });
  const fields = {
    stateId,
    cityCode: asString(data.cityCode, 'cityCode'),
    cityName: asString(data.cityName, 'cityName'),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };
  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.city.update({ where: { id: existing.id }, data: fields });
    return;
  }
  await tx.city.create({ data: { uuid, ...fields, createdAt: now } });
}

export async function applyArea(tx: TxClient, record: SyncCloudPullRecord) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());
  const cityId = await resolveCityId(tx, data);
  const existing = await tx.area.findFirst({ where: { uuid } });
  const fields = {
    cityId,
    areaCode: asString(data.areaCode, 'areaCode'),
    areaName: asString(data.areaName, 'areaName'),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };
  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.area.update({ where: { id: existing.id }, data: fields });
    return;
  }
  await tx.area.create({ data: { uuid, ...fields, createdAt: now } });
}

export async function applyMedicineGeneric(
  tx: TxClient,
  record: SyncCloudPullRecord,
) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());
  const existing = await tx.medicineGeneric.findFirst({ where: { uuid } });
  const fields = {
    genericCode: asString(data.genericCode, 'genericCode'),
    genericName: asString(data.genericName, 'genericName'),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };
  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.medicineGeneric.update({
      where: { id: existing.id },
      data: fields,
    });
    return;
  }
  await tx.medicineGeneric.create({
    data: { uuid, ...fields, createdAt: now },
  });
}

export async function applySaltComposition(
  tx: TxClient,
  record: SyncCloudPullRecord,
) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  const now = BigInt(Date.now());
  const genericUuid = asOptionalString(data.genericUuid);
  let genericId: bigint | undefined;
  if (genericUuid) {
    const generic = await tx.medicineGeneric.findFirst({
      where: { uuid: genericUuid },
    });
    genericId = generic?.id;
  }
  if (genericId == null) {
    throw new SyncApplyError('genericUuid is required for SaltComposition');
  }
  const existing = await tx.saltComposition.findFirst({ where: { uuid } });
  const fields = {
    genericId,
    compositionCode: asString(data.compositionCode, 'compositionCode'),
    strength: new Prisma.Decimal(String(data.strength ?? '0')),
    strengthUnit: asString(data.strengthUnit, 'strengthUnit'),
    isActive: asBool(data.isActive, true),
    updatedAt: now,
    version: serverVersion,
  };
  if (existing) {
    assertServerWins(existing.version, serverVersion);
    await tx.saltComposition.update({
      where: { id: existing.id },
      data: fields,
    });
    return;
  }
  await tx.saltComposition.create({
    data: {
      uuid,
      unitId: await defaultUnitId(tx),
      ...fields,
      createdAt: now,
    },
  });
}

async function defaultUnitId(tx: TxClient): Promise<bigint> {
  const unit = await tx.unitOfMeasure.findFirst({ orderBy: { id: 'asc' } });
  if (!unit) {
    throw new SyncApplyError('No unit of measure for salt composition create');
  }
  return unit.id;
}

export async function applyMedicineSalt(
  tx: TxClient,
  record: SyncCloudPullRecord,
) {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const medicineUuid = asOptionalString(data.medicineUuid);
  const compositionUuid = asOptionalString(data.compositionUuid);
  if (!medicineUuid || !compositionUuid) {
    throw new SyncApplyError('medicineUuid and compositionUuid required');
  }
  const medicine = await tx.medicine.findFirst({
    where: { uuid: medicineUuid },
  });
  const composition = await tx.saltComposition.findFirst({
    where: { uuid: compositionUuid },
  });
  if (!medicine || !composition) {
    throw new SyncApplyError(
      'Medicine or composition not found for MedicineSalt',
    );
  }
  const existing = await tx.medicineSalt.findFirst({ where: { uuid } });
  if (existing) {
    return;
  }
  await tx.medicineSalt.create({
    data: {
      uuid,
      medicineId: medicine.id,
      saltCompositionId: composition.id,
      sequenceNo: Number(data.sequenceNo ?? 1),
      version: serverVersionFromRecord(record),
    },
  });
}
