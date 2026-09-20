import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma, UnitOfMeasure } from '@prisma/client';
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
  CreateUnitOfMeasureDto,
  UpdateUnitOfMeasureDto,
} from '../dto/create-unit-of-measure.dto';
import { UnitOfMeasureListQueryDto } from '../dto/unit-of-measure-list-query.dto';
import { toUnitOfMeasureResponse } from '../mappers/unit-of-measure.mapper';
import {
  assertUniqueActiveField,
  assertUomNotInUse,
  optimisticUpdate,
  throwNotFound,
} from '../utils/medicine.util';

@Injectable()
export class UnitOfMeasureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: UnitOfMeasureListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.UnitOfMeasureWhereInput = {
      deletedAt: null,
      ...(query.unitType ? { unitType: query.unitType } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(search
        ? {
            OR: [
              { unitCode: { contains: search } },
              { unitName: { contains: search } },
              { shortName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.unitOfMeasure.count({ where }),
      this.prisma.client.unitOfMeasure.findMany({
        where,
        orderBy: { unitCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toUnitOfMeasureResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const unit = await this.prisma.client.unitOfMeasure.findFirst({
      where: { id, deletedAt: null },
    });

    if (!unit) {
      throwNotFound(
        ErrorCode.UNIT_OF_MEASURE_NOT_FOUND,
        `Unit of measure not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toUnitOfMeasureResponse(unit);
  }

  async create(dto: CreateUnitOfMeasureDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertUniqueActiveField(
        tx,
        'unitOfMeasure',
        'unitCode',
        dto.unitCode,
        'Unit code',
      );
      await assertUniqueActiveField(
        tx,
        'unitOfMeasure',
        'unitName',
        dto.unitName,
        'Unit name',
      );

      const now = BigInt(Date.now());
      const unit = await tx.unitOfMeasure.create({
        data: {
          uuid: randomUUID(),
          unitCode: dto.unitCode,
          unitName: dto.unitName,
          shortName: dto.shortName,
          unitType: dto.unitType,
          decimalAllowed: dto.decimalAllowed ?? false,
          description: dto.description,
          isSystemUnit: dto.isSystemUnit ?? false,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        unit,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toUnitOfMeasureResponse(unit);
    });
  }

  async update(id: bigint, dto: UpdateUnitOfMeasureDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.unitOfMeasure.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.UNIT_OF_MEASURE_NOT_FOUND,
          `Unit of measure not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (dto.unitCode && dto.unitCode !== existing.unitCode) {
        await assertUniqueActiveField(
          tx,
          'unitOfMeasure',
          'unitCode',
          dto.unitCode,
          'Unit code',
          id,
        );
      }

      if (dto.unitName && dto.unitName !== existing.unitName) {
        await assertUniqueActiveField(
          tx,
          'unitOfMeasure',
          'unitName',
          dto.unitName,
          'Unit name',
          id,
        );
      }

      const updateResult = await tx.unitOfMeasure.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          unitCode: dto.unitCode,
          unitName: dto.unitName,
          shortName: dto.shortName,
          unitType: dto.unitType,
          decimalAllowed: dto.decimalAllowed,
          description: dto.description,
          isSystemUnit: dto.isSystemUnit,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Unit of measure version conflict or not found: ${id}`,
      );

      const unit = await tx.unitOfMeasure.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        unit,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toUnitOfMeasureResponse(unit);
    });
  }

  async delete(id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.unitOfMeasure.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.UNIT_OF_MEASURE_NOT_FOUND,
          `Unit of measure not found: ${id}`,
          { id: id.toString() },
        );
      }

      await assertUomNotInUse(tx, id);

      const updateResult = await tx.unitOfMeasure.updateMany({
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
        `Unit of measure version conflict or not found: ${id}`,
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
    unit: UnitOfMeasure,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.UNIT_OF_MEASURE,
      entityId: unit.id,
      entityUuid: unit.uuid,
      action,
      module: AuditModule.MEDICINE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.UNIT_OF_MEASURE,
      entityUuid: unit.uuid,
      operation,
      payload: { uuid: unit.uuid, unitCode: unit.unitCode },
    });
  }
}
