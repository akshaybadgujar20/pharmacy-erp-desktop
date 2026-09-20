import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { MedicineGeneric, Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import {
  CreateMedicineGenericDto,
  UpdateMedicineGenericDto,
} from '../dto/create-medicine-generic.dto';
import { MedicineGenericListQueryDto } from '../dto/medicine-generic-list-query.dto';
import { toMedicineGenericResponse } from '../mappers/medicine-generic.mapper';
import {
  assertGenericNotInUse,
  assertUniqueActiveField,
  optimisticUpdate,
  throwNotFound,
} from '../utils/medicine.util';

@Injectable()
export class MedicineGenericService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: MedicineGenericListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.MedicineGenericWhereInput = {
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.therapeuticClass
        ? { therapeuticClass: query.therapeuticClass }
        : {}),
      ...(search
        ? {
            OR: [
              { genericCode: { contains: search } },
              { genericName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.medicineGeneric.count({ where }),
      this.prisma.client.medicineGeneric.findMany({
        where,
        orderBy: { genericCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toMedicineGenericResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const generic = await this.prisma.client.medicineGeneric.findFirst({
      where: { id, deletedAt: null },
    });

    if (!generic) {
      throwNotFound(
        ErrorCode.MEDICINE_GENERIC_NOT_FOUND,
        `Medicine generic not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toMedicineGenericResponse(generic);
  }

  async create(dto: CreateMedicineGenericDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertUniqueActiveField(
        tx,
        'medicineGeneric',
        'genericCode',
        dto.genericCode,
        'Generic code',
      );
      await assertUniqueActiveField(
        tx,
        'medicineGeneric',
        'genericName',
        dto.genericName,
        'Generic name',
      );

      const now = BigInt(Date.now());
      const generic = await tx.medicineGeneric.create({
        data: {
          uuid: randomUUID(),
          genericCode: dto.genericCode,
          genericName: dto.genericName,
          therapeuticClass: dto.therapeuticClass,
          pharmacologicalClass: dto.pharmacologicalClass,
          description: dto.description,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        generic,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toMedicineGenericResponse(generic);
    });
  }

  async update(id: bigint, dto: UpdateMedicineGenericDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.medicineGeneric.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.MEDICINE_GENERIC_NOT_FOUND,
          `Medicine generic not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (dto.genericCode && dto.genericCode !== existing.genericCode) {
        await assertUniqueActiveField(
          tx,
          'medicineGeneric',
          'genericCode',
          dto.genericCode,
          'Generic code',
          id,
        );
      }

      if (dto.genericName && dto.genericName !== existing.genericName) {
        await assertUniqueActiveField(
          tx,
          'medicineGeneric',
          'genericName',
          dto.genericName,
          'Generic name',
          id,
        );
      }

      const updateResult = await tx.medicineGeneric.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          genericCode: dto.genericCode,
          genericName: dto.genericName,
          therapeuticClass: dto.therapeuticClass,
          pharmacologicalClass: dto.pharmacologicalClass,
          description: dto.description,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Medicine generic version conflict or not found: ${id}`,
      );

      const generic = await tx.medicineGeneric.findFirstOrThrow({
        where: { id },
      });
      await this.emitChange(
        tx,
        generic,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toMedicineGenericResponse(generic);
    });
  }

  async delete(id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.medicineGeneric.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.MEDICINE_GENERIC_NOT_FOUND,
          `Medicine generic not found: ${id}`,
          { id: id.toString() },
        );
      }

      await assertGenericNotInUse(tx, id);

      const updateResult = await tx.medicineGeneric.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Medicine generic version conflict or not found: ${id}`,
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
    generic: MedicineGeneric,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.MEDICINE_GENERIC,
      entityId: generic.id,
      entityUuid: generic.uuid,
      action,
      module: AuditModule.MEDICINE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.MEDICINE_GENERIC,
      entityUuid: generic.uuid,
      operation,
      payload: { uuid: generic.uuid, genericCode: generic.genericCode },
    });
  }
}
