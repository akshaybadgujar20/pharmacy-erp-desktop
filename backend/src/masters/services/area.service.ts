import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Area, Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { auditAndLogChanges } from '../../audit/utils/audit.util';
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
import { AreaListQueryDto } from '../dto/area-list-query.dto';
import { CreateAreaDto } from '../dto/create-area.dto';
import { UpdateAreaDto } from '../dto/update-area.dto';
import { toAreaResponse } from '../mappers/area.mapper';
import {
  assertAreaUniqueInCity,
  assertCityExists,
  optimisticUpdate,
  throwNotFound,
} from '../utils/masters.util';

const AREA_AUDIT_FIELDS = [
  { name: 'cityId', dataType: 'bigint' },
  { name: 'areaCode' },
  { name: 'areaName' },
  { name: 'postalCode' },
  { name: 'deliveryZone' },
  { name: 'routeCode' },
  { name: 'latitude', dataType: 'number' },
  { name: 'longitude', dataType: 'number' },
  { name: 'isActive', dataType: 'boolean' },
];

@Injectable()
export class AreaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: AreaListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.AreaWhereInput = {
      deletedAt: null,
      ...(query.cityId ? { cityId: query.cityId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(search
        ? {
            OR: [
              { areaCode: { contains: search } },
              { areaName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.area.count({ where }),
      this.prisma.client.area.findMany({
        where,
        orderBy: { areaName: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toAreaResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const area = await this.prisma.client.area.findFirst({
      where: { id, deletedAt: null },
    });

    if (!area) {
      throwNotFound(ErrorCode.AREA_NOT_FOUND, `Area not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toAreaResponse(area);
  }

  async create(dto: CreateAreaDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertCityExists(tx, dto.cityId);
      await assertAreaUniqueInCity(tx, dto.cityId, 'areaCode', dto.areaCode);
      await assertAreaUniqueInCity(tx, dto.cityId, 'areaName', dto.areaName);

      const now = BigInt(Date.now());
      const area = await tx.area.create({
        data: {
          uuid: randomUUID(),
          cityId: dto.cityId,
          areaCode: dto.areaCode,
          areaName: dto.areaName,
          postalCode: dto.postalCode ?? null,
          deliveryZone: dto.deliveryZone ?? null,
          routeCode: dto.routeCode ?? null,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        area,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toAreaResponse(area);
    });
  }

  async update(id: bigint, dto: UpdateAreaDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.area.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.AREA_NOT_FOUND, `Area not found: ${id}`, {
          id: id.toString(),
        });
      }

      const cityId = dto.cityId ?? existing.cityId;
      if (dto.cityId) {
        await assertCityExists(tx, dto.cityId);
      }

      if (dto.areaCode && dto.areaCode !== existing.areaCode) {
        await assertAreaUniqueInCity(tx, cityId, 'areaCode', dto.areaCode, id);
      }
      if (dto.areaName && dto.areaName !== existing.areaName) {
        await assertAreaUniqueInCity(tx, cityId, 'areaName', dto.areaName, id);
      }

      const updateResult = await tx.area.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          cityId: dto.cityId,
          areaCode: dto.areaCode,
          areaName: dto.areaName,
          postalCode: dto.postalCode,
          deliveryZone: dto.deliveryZone,
          routeCode: dto.routeCode,
          latitude: dto.latitude,
          longitude: dto.longitude,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Area version conflict or not found: ${id}`,
      );

      const area = await tx.area.findFirstOrThrow({ where: { id } });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.AREA,
          entityId: area.id,
          entityUuid: area.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.LOOKUP,
        },
        existing as unknown as Record<string, unknown>,
        area as unknown as Record<string, unknown>,
        AREA_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.AREA,
        entityUuid: area.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: area.uuid, areaCode: area.areaCode },
      });
      return toAreaResponse(area);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.area.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.AREA_NOT_FOUND, `Area not found: ${id}`, {
          id: id.toString(),
        });
      }

      const updateResult = await tx.area.updateMany({
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
        `Area version conflict or not found: ${id}`,
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
    area: Area,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.AREA,
      entityId: area.id,
      entityUuid: area.uuid,
      action,
      module: AuditModule.LOOKUP,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.AREA,
      entityUuid: area.uuid,
      operation,
      payload: { uuid: area.uuid, areaCode: area.areaCode },
    });
  }
}
