import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';

export function serializeEpochMs(
  value: bigint | null | undefined,
): string | null {
  return value != null ? new Date(Number(value)).toISOString() : null;
}

export function optimisticUpdate<T extends { count: number }>(
  result: T,
  id: bigint,
  message = 'Entity version conflict or not found',
): void {
  if (result.count === 0) {
    throw new ApplicationException(
      ErrorCode.ENTITY_VERSION_CONFLICT,
      message,
      HttpStatus.CONFLICT,
      { id: id.toString() },
    );
  }
}

export function throwNotFound(
  code: string,
  message: string,
  details?: Record<string, string>,
): never {
  throw new ApplicationException(code, message, HttpStatus.NOT_FOUND, details);
}

export function throwConflict(
  code: string,
  message: string,
  details?: Record<string, string>,
): never {
  throw new ApplicationException(code, message, HttpStatus.CONFLICT, details);
}

export async function assertCountryExists(
  tx: TxClient,
  countryId: bigint,
): Promise<{ id: bigint; uuid: string }> {
  const country = await tx.country.findFirst({
    where: { id: countryId, deletedAt: null },
    select: { id: true, uuid: true },
  });

  if (!country) {
    throwNotFound(
      ErrorCode.COUNTRY_NOT_FOUND,
      `Country not found: ${countryId}`,
      {
        id: countryId.toString(),
      },
    );
  }

  return country;
}

export async function assertStateExists(
  tx: TxClient,
  stateId: bigint,
): Promise<{ id: bigint; uuid: string; countryId: bigint }> {
  const state = await tx.state.findFirst({
    where: { id: stateId, deletedAt: null },
    select: { id: true, uuid: true, countryId: true },
  });

  if (!state) {
    throwNotFound(ErrorCode.STATE_NOT_FOUND, `State not found: ${stateId}`, {
      id: stateId.toString(),
    });
  }

  return state;
}

export async function assertCityExists(
  tx: TxClient,
  cityId: bigint,
): Promise<{ id: bigint; uuid: string; stateId: bigint }> {
  const city = await tx.city.findFirst({
    where: { id: cityId, deletedAt: null },
    select: { id: true, uuid: true, stateId: true },
  });

  if (!city) {
    throwNotFound(ErrorCode.CITY_NOT_FOUND, `City not found: ${cityId}`, {
      id: cityId.toString(),
    });
  }

  return city;
}

export async function assertAreaExists(
  tx: TxClient,
  areaId: bigint,
): Promise<{ id: bigint; uuid: string; cityId: bigint }> {
  const area = await tx.area.findFirst({
    where: { id: areaId, deletedAt: null },
    select: { id: true, uuid: true, cityId: true },
  });

  if (!area) {
    throwNotFound(ErrorCode.AREA_NOT_FOUND, `Area not found: ${areaId}`, {
      id: areaId.toString(),
    });
  }

  return area;
}

export async function assertCountryUniqueField(
  tx: TxClient,
  field: 'countryCode' | 'isoAlpha2' | 'isoAlpha3',
  value: string,
  excludeId?: bigint,
): Promise<void> {
  const existing = await tx.country.findFirst({
    where: {
      [field]: value,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throwConflict(
      ErrorCode.COUNTRY_CONFLICT,
      `Country ${field} already exists: ${value}`,
      { [field]: value },
    );
  }
}

export async function assertStateUniqueInCountry(
  tx: TxClient,
  countryId: bigint,
  field: 'stateCode' | 'stateName',
  value: string,
  excludeId?: bigint,
): Promise<void> {
  const existing = await tx.state.findFirst({
    where: {
      countryId,
      [field]: value,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throwConflict(
      ErrorCode.STATE_CONFLICT,
      `State ${field} already exists in country: ${value}`,
      { [field]: value, countryId: countryId.toString() },
    );
  }
}

export async function assertCityUniqueInState(
  tx: TxClient,
  stateId: bigint,
  field: 'cityCode' | 'cityName',
  value: string,
  excludeId?: bigint,
): Promise<void> {
  const existing = await tx.city.findFirst({
    where: {
      stateId,
      [field]: value,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throwConflict(
      ErrorCode.CITY_CONFLICT,
      `City ${field} already exists in state: ${value}`,
      { [field]: value, stateId: stateId.toString() },
    );
  }
}

export async function assertAreaUniqueInCity(
  tx: TxClient,
  cityId: bigint,
  field: 'areaCode' | 'areaName',
  value: string,
  excludeId?: bigint,
): Promise<void> {
  const existing = await tx.area.findFirst({
    where: {
      cityId,
      [field]: value,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throwConflict(
      ErrorCode.AREA_CONFLICT,
      `Area ${field} already exists in city: ${value}`,
      { [field]: value, cityId: cityId.toString() },
    );
  }
}

export async function assertCountryNotInUse(
  tx: TxClient,
  countryId: bigint,
): Promise<void> {
  const [stateCount, addressCount] = await Promise.all([
    tx.state.count({ where: { countryId, deletedAt: null } }),
    tx.partyAddress.count({ where: { countryId, deletedAt: null } }),
  ]);

  const total = stateCount + addressCount;

  if (total > 0) {
    throwConflict(
      ErrorCode.COUNTRY_IN_USE,
      `Country is referenced by states or party addresses: ${countryId}`,
      { id: countryId.toString(), referenceCount: total.toString() },
    );
  }
}

export async function assertStateNotInUse(
  tx: TxClient,
  stateId: bigint,
): Promise<void> {
  const [cityCount, addressCount] = await Promise.all([
    tx.city.count({ where: { stateId, deletedAt: null } }),
    tx.partyAddress.count({ where: { stateId, deletedAt: null } }),
  ]);

  const total = cityCount + addressCount;

  if (total > 0) {
    throwConflict(
      ErrorCode.STATE_IN_USE,
      `State is referenced by cities or party addresses: ${stateId}`,
      { id: stateId.toString(), referenceCount: total.toString() },
    );
  }
}

export async function assertCityNotInUse(
  tx: TxClient,
  cityId: bigint,
): Promise<void> {
  const [areaCount, addressCount] = await Promise.all([
    tx.area.count({ where: { cityId, deletedAt: null } }),
    tx.partyAddress.count({ where: { cityId, deletedAt: null } }),
  ]);

  const total = areaCount + addressCount;

  if (total > 0) {
    throwConflict(
      ErrorCode.CITY_IN_USE,
      `City is referenced by areas or party addresses: ${cityId}`,
      { id: cityId.toString(), referenceCount: total.toString() },
    );
  }
}
