import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { MedicineSchedule, Prisma } from '@prisma/client';
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
  CreateMedicineScheduleDto,
  UpdateMedicineScheduleDto,
} from '../dto/create-medicine-schedule.dto';
import { MedicineScheduleListQueryDto } from '../dto/medicine-schedule-list-query.dto';
import { toMedicineScheduleResponse } from '../mappers/medicine-schedule.mapper';
import {
  assertScheduleNotInUse,
  assertUniqueActiveField,
  optimisticUpdate,
  throwNotFound,
} from '../utils/medicine.util';

@Injectable()
export class MedicineScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: MedicineScheduleListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.MedicineScheduleWhereInput = {
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.requiresPrescription !== undefined
        ? { requiresPrescription: query.requiresPrescription }
        : {}),
      ...(search
        ? {
            OR: [
              { scheduleCode: { contains: search } },
              { scheduleName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.medicineSchedule.count({ where }),
      this.prisma.client.medicineSchedule.findMany({
        where,
        orderBy: { scheduleCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toMedicineScheduleResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const schedule = await this.prisma.client.medicineSchedule.findFirst({
      where: { id, deletedAt: null },
    });

    if (!schedule) {
      throwNotFound(
        ErrorCode.MEDICINE_SCHEDULE_NOT_FOUND,
        `Medicine schedule not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toMedicineScheduleResponse(schedule);
  }

  async create(dto: CreateMedicineScheduleDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertUniqueActiveField(
        tx,
        'medicineSchedule',
        'scheduleCode',
        dto.scheduleCode,
        'Schedule code',
      );
      await assertUniqueActiveField(
        tx,
        'medicineSchedule',
        'scheduleName',
        dto.scheduleName,
        'Schedule name',
      );

      const now = BigInt(Date.now());
      const schedule = await tx.medicineSchedule.create({
        data: {
          uuid: randomUUID(),
          scheduleCode: dto.scheduleCode,
          scheduleName: dto.scheduleName,
          description: dto.description,
          requiresPrescription: dto.requiresPrescription ?? false,
          requiresDoctorDetails: dto.requiresDoctorDetails ?? false,
          maintainSalesRegister: dto.maintainSalesRegister ?? false,
          controlledSubstance: dto.controlledSubstance ?? false,
          isSystemSchedule: dto.isSystemSchedule ?? false,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        schedule,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toMedicineScheduleResponse(schedule);
    });
  }

  async update(id: bigint, dto: UpdateMedicineScheduleDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.medicineSchedule.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.MEDICINE_SCHEDULE_NOT_FOUND,
          `Medicine schedule not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (dto.scheduleCode && dto.scheduleCode !== existing.scheduleCode) {
        await assertUniqueActiveField(
          tx,
          'medicineSchedule',
          'scheduleCode',
          dto.scheduleCode,
          'Schedule code',
          id,
        );
      }

      if (dto.scheduleName && dto.scheduleName !== existing.scheduleName) {
        await assertUniqueActiveField(
          tx,
          'medicineSchedule',
          'scheduleName',
          dto.scheduleName,
          'Schedule name',
          id,
        );
      }

      const updateResult = await tx.medicineSchedule.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          scheduleCode: dto.scheduleCode,
          scheduleName: dto.scheduleName,
          description: dto.description,
          requiresPrescription: dto.requiresPrescription,
          requiresDoctorDetails: dto.requiresDoctorDetails,
          maintainSalesRegister: dto.maintainSalesRegister,
          controlledSubstance: dto.controlledSubstance,
          isSystemSchedule: dto.isSystemSchedule,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Medicine schedule version conflict or not found: ${id}`,
      );

      const schedule = await tx.medicineSchedule.findFirstOrThrow({
        where: { id },
      });
      await this.emitChange(
        tx,
        schedule,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toMedicineScheduleResponse(schedule);
    });
  }

  async delete(id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.medicineSchedule.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.MEDICINE_SCHEDULE_NOT_FOUND,
          `Medicine schedule not found: ${id}`,
          { id: id.toString() },
        );
      }

      await assertScheduleNotInUse(tx, id);

      const updateResult = await tx.medicineSchedule.updateMany({
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
        `Medicine schedule version conflict or not found: ${id}`,
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
    schedule: MedicineSchedule,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.MEDICINE_SCHEDULE,
      entityId: schedule.id,
      entityUuid: schedule.uuid,
      action,
      module: AuditModule.MEDICINE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.MEDICINE_SCHEDULE,
      entityUuid: schedule.uuid,
      operation,
      payload: { uuid: schedule.uuid, scheduleCode: schedule.scheduleCode },
    });
  }
}
