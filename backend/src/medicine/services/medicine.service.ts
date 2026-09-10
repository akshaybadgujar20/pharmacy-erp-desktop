import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Medicine, Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { CreateMedicineDto } from '../dto/create-medicine.dto';
import { MedicineListQueryDto } from '../dto/medicine-list-query.dto';
import { UpdateMedicineDto } from '../dto/update-medicine.dto';
import { toMedicineResponse } from '../mappers/medicine.mapper';
import {
  assertBarcodeUnique,
  assertCategoryExists,
  assertManufacturerExists,
  assertMedicineCodeUnique,
  assertMedicineNameUniquePerManufacturer,
  assertMedicineNotInUse,
  assertScheduleExists,
  assertUnitExists,
  optimisticUpdate,
  throwNotFound,
} from '../utils/medicine.util';

@Injectable()
export class MedicineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: MedicineListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const manufacturerId = query.manufacturerId
      ? BigInt(query.manufacturerId)
      : undefined;
    const categoryId = query.categoryId ? BigInt(query.categoryId) : undefined;
    const scheduleId = query.scheduleId ? BigInt(query.scheduleId) : undefined;

    const where: Prisma.MedicineWhereInput = {
      deletedAt: null,
      ...(manufacturerId !== undefined ? { manufacturerId } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(scheduleId !== undefined ? { scheduleId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.discontinued !== undefined
        ? { discontinued: query.discontinued }
        : {}),
      ...(search
        ? {
            OR: [
              { medicineName: { contains: search } },
              { medicineCode: { contains: search } },
              { barcode: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.medicine.count({ where }),
      this.prisma.client.medicine.findMany({
        where,
        orderBy: { medicineCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toMedicineResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const medicine = await this.prisma.client.medicine.findFirst({
      where: { id, deletedAt: null },
    });

    if (!medicine) {
      throwNotFound(ErrorCode.MEDICINE_NOT_FOUND, `Medicine not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toMedicineResponse(medicine);
  }

  async create(dto: CreateMedicineDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertManufacturerExists(tx, dto.manufacturerId);
      await assertCategoryExists(tx, dto.categoryId);
      await assertUnitExists(tx, dto.unitId);

      if (dto.scheduleId) {
        await assertScheduleExists(tx, dto.scheduleId);
      }

      await assertMedicineCodeUnique(tx, dto.medicineCode);
      await assertMedicineNameUniquePerManufacturer(
        tx,
        dto.manufacturerId,
        dto.medicineName,
      );
      await assertBarcodeUnique(tx, dto.barcode);

      const now = BigInt(Date.now());
      const medicine = await tx.medicine.create({
        data: {
          uuid: randomUUID(),
          medicineCode: dto.medicineCode,
          medicineName: dto.medicineName,
          manufacturerId: dto.manufacturerId,
          categoryId: dto.categoryId,
          scheduleId: dto.scheduleId ?? null,
          unitId: dto.unitId,
          brandName: dto.brandName,
          strength: dto.strength,
          dosageForm: dto.dosageForm,
          packSize: dto.packSize,
          hsnCode: dto.hsnCode,
          barcode: dto.barcode,
          requiresPrescription: dto.requiresPrescription ?? false,
          narcoticDrug: dto.narcoticDrug ?? false,
          refrigerated: dto.refrigerated ?? false,
          discontinued: dto.discontinued ?? false,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        medicine,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toMedicineResponse(medicine);
    });
  }

  async update(id: bigint, dto: UpdateMedicineDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.medicine.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.MEDICINE_NOT_FOUND,
          `Medicine not found: ${id}`,
          { id: id.toString() },
        );
      }

      const manufacturerId = dto.manufacturerId ?? existing.manufacturerId;
      const medicineName = dto.medicineName ?? existing.medicineName;

      if (dto.manufacturerId) {
        await assertManufacturerExists(tx, dto.manufacturerId);
      }

      if (dto.categoryId) {
        await assertCategoryExists(tx, dto.categoryId);
      }

      if (dto.unitId) {
        await assertUnitExists(tx, dto.unitId);
      }

      if (dto.scheduleId !== undefined && dto.scheduleId != null) {
        await assertScheduleExists(tx, dto.scheduleId);
      }

      if (
        manufacturerId !== existing.manufacturerId ||
        medicineName !== existing.medicineName
      ) {
        await assertMedicineNameUniquePerManufacturer(
          tx,
          manufacturerId,
          medicineName,
          id,
        );
      }

      if (dto.barcode !== undefined && dto.barcode !== existing.barcode) {
        await assertBarcodeUnique(tx, dto.barcode, id);
      }

      const updateResult = await tx.medicine.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          medicineName: dto.medicineName,
          manufacturerId: dto.manufacturerId,
          categoryId: dto.categoryId,
          ...(dto.scheduleId !== undefined
            ? { scheduleId: dto.scheduleId }
            : {}),
          unitId: dto.unitId,
          brandName: dto.brandName,
          strength: dto.strength,
          dosageForm: dto.dosageForm,
          packSize: dto.packSize,
          hsnCode: dto.hsnCode,
          barcode: dto.barcode,
          requiresPrescription: dto.requiresPrescription,
          narcoticDrug: dto.narcoticDrug,
          refrigerated: dto.refrigerated,
          discontinued: dto.discontinued,
          isActive: dto.isActive,
          updatedBy: this.requestContext.tryGet()?.userId,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Medicine version conflict or not found: ${id}`,
      );

      const medicine = await tx.medicine.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        medicine,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toMedicineResponse(medicine);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.medicine.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.MEDICINE_NOT_FOUND,
          `Medicine not found: ${id}`,
          { id: id.toString() },
        );
      }

      await assertMedicineNotInUse(tx, id);

      const updateResult = await tx.medicine.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          deletedBy: this.requestContext.tryGet()?.userId,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Medicine version conflict or not found: ${id}`,
      );

      await this.emitChange(
        tx,
        existing,
        AuditAction.DELETE,
        OutboxOperation.DELETE,
      );
      return { id: id.toString(), deleted: true };
    });
  }

  private async emitChange(
    tx: TxClient,
    medicine: Medicine,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.MEDICINE,
      entityId: medicine.id,
      entityUuid: medicine.uuid,
      action,
      module: AuditModule.MEDICINE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.MEDICINE,
      entityUuid: medicine.uuid,
      operation,
      payload: { uuid: medicine.uuid, medicineCode: medicine.medicineCode },
    });
  }
}
