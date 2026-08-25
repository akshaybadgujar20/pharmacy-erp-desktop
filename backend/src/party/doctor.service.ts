import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../audit/audit-action.constants';
import { AuditModule } from '../audit/audit-module.constants';
import { AuditService } from '../audit/audit.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ErrorCode } from '../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../common/response/paginated-result';
import { OutboxEntityType } from '../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { toDoctorResponse } from './mappers/doctor.mapper';
import {
  assertPartyExists,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from './utils/party.util';

@Injectable()
export class DoctorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.DoctorWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { doctorCode: { contains: search } },
              { registrationNumber: { contains: search } },
              { party: { displayName: { contains: search } } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.doctor.count({ where }),
      this.prisma.client.doctor.findMany({
        where,
        orderBy: { doctorCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toDoctorResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const doctor = await this.prisma.client.doctor.findFirst({
      where: { id, deletedAt: null },
    });

    if (!doctor) {
      throwNotFound(ErrorCode.DOCTOR_NOT_FOUND, `Doctor not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toDoctorResponse(doctor);
  }

  async create(dto: CreateDoctorDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertPartyExists(tx, BigInt(dto.partyId));

      const partyId = BigInt(dto.partyId);

      const existingDetail = await tx.doctor.findFirst({
        where: { partyId, deletedAt: null },
      });

      if (existingDetail) {
        throwConflict(`Doctor already exists for party: ${partyId}`, {
          partyId: partyId.toString(),
        });
      }

      const doctor = await tx.doctor.create({
        data: {
          uuid: randomUUID(),
          partyId,
          doctorCode: dto.doctorCode,
          registrationNumber: dto.registrationNumber,
          qualification: dto.qualification,
          specialization: dto.specialization,
          hospitalName: dto.hospitalName,
          consultationFee: dto.consultationFee,
          isVisitingDoctor: dto.isVisitingDoctor ?? false,
          isActive: dto.isActive ?? true,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.DOCTOR,
        entityId: doctor.id,
        entityUuid: doctor.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.DOCTOR,
        entityUuid: doctor.uuid,
        operation: OutboxOperation.CREATE,
        payload: { uuid: doctor.uuid, doctorCode: doctor.doctorCode },
      });

      return toDoctorResponse(doctor);
    });
  }

  async update(id: bigint, dto: UpdateDoctorDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.doctor.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.DOCTOR_NOT_FOUND, `Doctor not found: ${id}`, {
          id: id.toString(),
        });
      }

      const updateResult = await tx.doctor.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          doctorCode: dto.doctorCode,
          registrationNumber: dto.registrationNumber,
          qualification: dto.qualification,
          specialization: dto.specialization,
          hospitalName: dto.hospitalName,
          consultationFee: dto.consultationFee,
          isVisitingDoctor: dto.isVisitingDoctor,
          isActive: dto.isActive,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        ErrorCode.DOCTOR_NOT_FOUND,
        `Doctor version conflict or not found: ${id}`,
        id,
      );

      const doctor = await tx.doctor.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.DOCTOR,
        entityId: doctor.id,
        entityUuid: doctor.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.DOCTOR,
        entityUuid: doctor.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: doctor.uuid, doctorCode: doctor.doctorCode },
      });

      return toDoctorResponse(doctor);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.doctor.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.DOCTOR_NOT_FOUND, `Doctor not found: ${id}`, {
          id: id.toString(),
        });
      }

      const updateResult = await tx.doctor.updateMany({
        where: { id, version, deletedAt: null },
        data: { deletedAt: new Date(), version: { increment: 1 } },
      });

      optimisticUpdate(
        updateResult,
        ErrorCode.DOCTOR_NOT_FOUND,
        `Doctor version conflict or not found: ${id}`,
        id,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.DOCTOR,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.DOCTOR,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }
}
