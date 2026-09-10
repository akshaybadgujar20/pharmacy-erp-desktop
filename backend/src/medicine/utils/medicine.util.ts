import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { CATEGORY_HIERARCHY_MAX_DEPTH } from '../constants/medicine.constants';

type MedicineLookupClient = Pick<TxClient, 'medicine'>;

export function serializeBigInt(
  value: bigint | null | undefined,
): string | null {
  return value != null ? value.toString() : null;
}

export function serializeDecimal(
  value: Prisma.Decimal | null | undefined,
): string | null {
  return value != null ? value.toString() : null;
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

export async function assertPartyExistsForManufacturer(
  tx: TxClient,
  partyId: bigint,
): Promise<{ id: bigint; uuid: string }> {
  const party = await tx.party.findFirst({
    where: { id: partyId, deletedAt: null },
    select: { id: true, uuid: true },
  });

  if (!party) {
    throwNotFound(ErrorCode.PARTY_NOT_FOUND, `Party not found: ${partyId}`, {
      partyId: partyId.toString(),
    });
  }

  return party;
}

export async function assertManufacturerExists(
  tx: TxClient,
  manufacturerId: bigint,
  requireActive = true,
): Promise<{ id: bigint; uuid: string }> {
  const manufacturer = await tx.manufacturer.findFirst({
    where: {
      id: manufacturerId,
      deletedAt: null,
      ...(requireActive ? { isActive: true } : {}),
    },
    select: { id: true, uuid: true },
  });

  if (!manufacturer) {
    throwNotFound(
      ErrorCode.MANUFACTURER_NOT_FOUND,
      `Manufacturer not found: ${manufacturerId}`,
      { id: manufacturerId.toString() },
    );
  }

  return manufacturer;
}

export async function assertCategoryExists(
  tx: TxClient,
  categoryId: bigint,
  requireActive = true,
): Promise<{ id: bigint; uuid: string }> {
  const category = await tx.medicineCategory.findFirst({
    where: {
      id: categoryId,
      deletedAt: null,
      ...(requireActive ? { isActive: true } : {}),
    },
    select: { id: true, uuid: true },
  });

  if (!category) {
    throwNotFound(
      ErrorCode.MEDICINE_CATEGORY_NOT_FOUND,
      `Medicine category not found: ${categoryId}`,
      { id: categoryId.toString() },
    );
  }

  return category;
}

export async function assertScheduleExists(
  tx: TxClient,
  scheduleId: bigint,
  requireActive = true,
): Promise<{ id: bigint; uuid: string }> {
  const schedule = await tx.medicineSchedule.findFirst({
    where: {
      id: scheduleId,
      deletedAt: null,
      ...(requireActive ? { isActive: true } : {}),
    },
    select: { id: true, uuid: true },
  });

  if (!schedule) {
    throwNotFound(
      ErrorCode.MEDICINE_SCHEDULE_NOT_FOUND,
      `Medicine schedule not found: ${scheduleId}`,
      { id: scheduleId.toString() },
    );
  }

  return schedule;
}

export async function assertUnitExists(
  tx: TxClient,
  unitId: bigint,
  requireActive = true,
): Promise<{ id: bigint; uuid: string }> {
  const unit = await tx.unitOfMeasure.findFirst({
    where: {
      id: unitId,
      deletedAt: null,
      ...(requireActive ? { isActive: true } : {}),
    },
    select: { id: true, uuid: true },
  });

  if (!unit) {
    throwNotFound(
      ErrorCode.UNIT_OF_MEASURE_NOT_FOUND,
      `Unit of measure not found: ${unitId}`,
      { id: unitId.toString() },
    );
  }

  return unit;
}

export async function assertGenericExists(
  tx: TxClient,
  genericId: bigint,
  requireActive = true,
): Promise<{ id: bigint; uuid: string }> {
  const generic = await tx.medicineGeneric.findFirst({
    where: {
      id: genericId,
      deletedAt: null,
      ...(requireActive ? { isActive: true } : {}),
    },
    select: { id: true, uuid: true },
  });

  if (!generic) {
    throwNotFound(
      ErrorCode.MEDICINE_GENERIC_NOT_FOUND,
      `Medicine generic not found: ${genericId}`,
      { id: genericId.toString() },
    );
  }

  return generic;
}

export async function assertSaltCompositionExists(
  tx: TxClient,
  saltCompositionId: bigint,
  requireActive = true,
): Promise<{ id: bigint; uuid: string; genericId: bigint }> {
  const saltComposition = await tx.saltComposition.findFirst({
    where: {
      id: saltCompositionId,
      deletedAt: null,
      ...(requireActive ? { isActive: true } : {}),
    },
    select: { id: true, uuid: true, genericId: true },
  });

  if (!saltComposition) {
    throwNotFound(
      ErrorCode.SALT_COMPOSITION_NOT_FOUND,
      `Salt composition not found: ${saltCompositionId}`,
      { id: saltCompositionId.toString() },
    );
  }

  return saltComposition;
}

export async function assertMedicineExists(
  client: MedicineLookupClient,
  medicineId: bigint,
  requireActive = true,
): Promise<{ id: bigint; uuid: string }> {
  const medicine = await client.medicine.findFirst({
    where: {
      id: medicineId,
      deletedAt: null,
      ...(requireActive ? { isActive: true } : {}),
    },
    select: { id: true, uuid: true },
  });

  if (!medicine) {
    throwNotFound(
      ErrorCode.MEDICINE_NOT_FOUND,
      `Medicine not found: ${medicineId}`,
      { id: medicineId.toString() },
    );
  }

  return medicine;
}

export async function assertMedicineCodeUnique(
  tx: TxClient,
  code: string,
  excludeId?: bigint,
): Promise<void> {
  const existing = await tx.medicine.findFirst({
    where: {
      medicineCode: code,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throwConflict(
      ErrorCode.MEDICINE_CODE_ALREADY_EXISTS,
      `Medicine code already exists: ${code}`,
      { medicineCode: code },
    );
  }
}

export async function assertBarcodeUnique(
  tx: TxClient,
  barcode: string | null | undefined,
  excludeId?: bigint,
): Promise<void> {
  const normalized = barcode?.trim();
  if (!normalized) {
    return;
  }

  const existing = await tx.medicine.findFirst({
    where: {
      barcode: normalized,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throwConflict(
      ErrorCode.MEDICINE_BARCODE_ALREADY_EXISTS,
      `Medicine barcode already exists: ${normalized}`,
      { barcode: normalized },
    );
  }
}

export async function assertSaltCompositionCompositeUnique(
  tx: TxClient,
  genericId: bigint,
  strength: Prisma.Decimal | string,
  strengthUnit: string,
  excludeId?: bigint,
): Promise<void> {
  const existing = await tx.saltComposition.findFirst({
    where: {
      genericId,
      strength,
      strengthUnit,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throwConflict(
      ErrorCode.SALT_COMPOSITION_ALREADY_EXISTS,
      'Salt composition already exists for generic, strength, and unit',
      {
        genericId: genericId.toString(),
        strength: strength.toString(),
        strengthUnit,
      },
    );
  }
}

export async function assertMedicineNameUniquePerManufacturer(
  tx: TxClient,
  manufacturerId: bigint,
  name: string,
  excludeId?: bigint,
): Promise<void> {
  const existing = await tx.medicine.findFirst({
    where: {
      manufacturerId,
      medicineName: name,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throwConflict(
      ErrorCode.MEDICINE_NAME_ALREADY_EXISTS,
      `Medicine name already exists for manufacturer: ${name}`,
      { manufacturerId: manufacturerId.toString(), medicineName: name },
    );
  }
}

export async function assertNoCategoryCycle(
  tx: TxClient,
  categoryId: bigint | null,
  parentCategoryId: bigint | null,
): Promise<void> {
  if (parentCategoryId == null) {
    return;
  }

  if (categoryId != null && categoryId === parentCategoryId) {
    throw new ApplicationException(
      ErrorCode.CATEGORY_CIRCULAR_REFERENCE,
      'Category cannot be its own parent',
      HttpStatus.BAD_REQUEST,
      { categoryId: categoryId.toString() },
    );
  }

  let currentParentId: bigint | null = parentCategoryId;
  const visited = new Set<string>();
  let depth = 0;

  while (currentParentId != null && depth < CATEGORY_HIERARCHY_MAX_DEPTH) {
    if (categoryId != null && currentParentId === categoryId) {
      throw new ApplicationException(
        ErrorCode.CATEGORY_CIRCULAR_REFERENCE,
        'Circular category hierarchy detected',
        HttpStatus.BAD_REQUEST,
        { categoryId: categoryId.toString() },
      );
    }

    const key = currentParentId.toString();
    if (visited.has(key)) {
      throw new ApplicationException(
        ErrorCode.CATEGORY_CIRCULAR_REFERENCE,
        'Circular category hierarchy detected',
        HttpStatus.BAD_REQUEST,
        { parentCategoryId: key },
      );
    }
    visited.add(key);

    const parent: { parentCategoryId: bigint | null } | null =
      await tx.medicineCategory.findFirst({
        where: { id: currentParentId, deletedAt: null },
        select: { parentCategoryId: true },
      });

    if (!parent) {
      break;
    }

    currentParentId = parent.parentCategoryId;
    depth += 1;
  }

  if (currentParentId != null && depth >= CATEGORY_HIERARCHY_MAX_DEPTH) {
    throw new ApplicationException(
      ErrorCode.CATEGORY_HIERARCHY_TOO_DEEP,
      'Category hierarchy exceeds maximum depth',
      HttpStatus.BAD_REQUEST,
      { maxDepth: CATEGORY_HIERARCHY_MAX_DEPTH.toString() },
    );
  }
}

export async function assertUniqueActiveField(
  tx: TxClient,
  model:
    | 'medicineCategory'
    | 'medicineGeneric'
    | 'medicineSchedule'
    | 'unitOfMeasure'
    | 'saltComposition'
    | 'manufacturer',
  field: string,
  value: string,
  label: string,
  excludeId?: bigint,
): Promise<void> {
  const delegate = tx[model] as unknown as {
    findFirst: (args: {
      where: Record<string, unknown>;
    }) => Promise<{ id: bigint } | null>;
  };

  const existing = await delegate.findFirst({
    where: {
      [field]: value,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  if (existing) {
    throwConflict(ErrorCode.CONFLICT, `${label} already exists: ${value}`, {
      [field]: value,
    });
  }
}

export async function assertManufacturerNotInUse(
  tx: TxClient,
  manufacturerId: bigint,
): Promise<void> {
  const count = await tx.medicine.count({
    where: { manufacturerId, deletedAt: null },
  });

  if (count > 0) {
    throwConflict(
      ErrorCode.MANUFACTURER_IN_USE,
      `Manufacturer is referenced by medicines: ${manufacturerId}`,
      { id: manufacturerId.toString(), medicineCount: count.toString() },
    );
  }
}

export async function assertMedicineNotInUse(
  tx: TxClient,
  medicineId: bigint,
): Promise<void> {
  const [
    batches,
    stockMovements,
    purchaseOrderItems,
    purchaseInvoiceItems,
    goodsReceiptItems,
    purchaseReturnItems,
    salesInvoiceItems,
    salesReturnItems,
    priceListItems,
    prescriptionItems,
    discountRules,
  ] = await Promise.all([
    tx.batch.count({ where: { medicineId } }),
    tx.stockMovement.count({ where: { medicineId } }),
    tx.purchaseOrderItem.count({ where: { medicineId } }),
    tx.purchaseInvoiceItem.count({ where: { medicineId } }),
    tx.goodsReceiptItem.count({ where: { medicineId } }),
    tx.purchaseReturnItem.count({ where: { medicineId } }),
    tx.salesInvoiceItem.count({ where: { medicineId } }),
    tx.salesReturnItem.count({ where: { medicineId } }),
    tx.priceListItem.count({ where: { medicineId } }),
    tx.prescriptionItem.count({ where: { medicineId } }),
    tx.discountRule.count({ where: { medicineId, deletedAt: null } }),
  ]);

  const total =
    batches +
    stockMovements +
    purchaseOrderItems +
    purchaseInvoiceItems +
    goodsReceiptItems +
    purchaseReturnItems +
    salesInvoiceItems +
    salesReturnItems +
    priceListItems +
    prescriptionItems +
    discountRules;

  if (total > 0) {
    throwConflict(
      ErrorCode.MEDICINE_IN_USE,
      `Medicine is referenced by downstream records: ${medicineId}`,
      { id: medicineId.toString(), referenceCount: total.toString() },
    );
  }
}

export async function assertCategoryNotInUse(
  tx: TxClient,
  categoryId: bigint,
): Promise<void> {
  const childCount = await tx.medicineCategory.count({
    where: { parentCategoryId: categoryId, deletedAt: null },
  });

  if (childCount > 0) {
    throwConflict(
      ErrorCode.CATEGORY_HAS_CHILDREN,
      `Category has child categories: ${categoryId}`,
      { id: categoryId.toString(), childCount: childCount.toString() },
    );
  }

  const medicineCount = await tx.medicine.count({
    where: { categoryId, deletedAt: null },
  });

  if (medicineCount > 0) {
    throwConflict(
      ErrorCode.CATEGORY_IN_USE,
      `Category is assigned to medicines: ${categoryId}`,
      { id: categoryId.toString(), medicineCount: medicineCount.toString() },
    );
  }
}

export async function assertGenericNotInUse(
  tx: TxClient,
  genericId: bigint,
): Promise<void> {
  const count = await tx.saltComposition.count({
    where: { genericId, deletedAt: null },
  });

  if (count > 0) {
    throwConflict(
      ErrorCode.GENERIC_IN_USE,
      `Generic is referenced by salt compositions: ${genericId}`,
      { id: genericId.toString(), saltCompositionCount: count.toString() },
    );
  }
}

export async function assertScheduleNotInUse(
  tx: TxClient,
  scheduleId: bigint,
): Promise<void> {
  const count = await tx.medicine.count({
    where: { scheduleId, deletedAt: null },
  });

  if (count > 0) {
    throwConflict(
      ErrorCode.SCHEDULE_IN_USE,
      `Schedule is assigned to medicines: ${scheduleId}`,
      { id: scheduleId.toString(), medicineCount: count.toString() },
    );
  }
}

export async function assertUomNotInUse(
  tx: TxClient,
  unitId: bigint,
): Promise<void> {
  const counts = await Promise.all([
    tx.medicine.count({ where: { unitId, deletedAt: null } }),
    tx.saltComposition.count({ where: { unitId, deletedAt: null } }),
    tx.prescriptionItem.count({ where: { unitId } }),
    tx.goodsReceiptItem.count({ where: { unitId } }),
    tx.purchaseInvoiceItem.count({ where: { unitId } }),
    tx.purchaseOrderItem.count({ where: { unitId } }),
    tx.purchaseReturnItem.count({ where: { unitId } }),
    tx.salesInvoiceItem.count({ where: { unitId } }),
    tx.salesReturnItem.count({ where: { unitId } }),
  ]);

  const total = counts.reduce((sum, count) => sum + count, 0);

  if (total > 0) {
    throwConflict(
      ErrorCode.UOM_IN_USE,
      `Unit of measure is referenced by downstream records: ${unitId}`,
      { id: unitId.toString(), referenceCount: total.toString() },
    );
  }
}

export async function assertSaltCompositionNotInUse(
  tx: TxClient,
  saltCompositionId: bigint,
): Promise<void> {
  const count = await tx.medicineSalt.count({
    where: { saltCompositionId },
  });

  if (count > 0) {
    throwConflict(
      ErrorCode.SALT_COMPOSITION_IN_USE,
      `Salt composition is referenced by medicine salts: ${saltCompositionId}`,
      { id: saltCompositionId.toString(), medicineSaltCount: count.toString() },
    );
  }
}

export async function assertManufacturerFieldUnique(
  tx: TxClient,
  field: 'manufacturerCode' | 'manufacturingLicenseNo' | 'gstin',
  value: string,
  label: string,
  excludeId?: bigint,
): Promise<void> {
  const existing = await tx.manufacturer.findFirst({
    where: {
      [field]: value,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throwConflict(ErrorCode.CONFLICT, `${label} already exists: ${value}`, {
      [field]: value,
    });
  }
}
