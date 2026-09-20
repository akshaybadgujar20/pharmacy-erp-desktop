import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { City, Prisma } from '@prisma/client';
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
import { CityListQueryDto } from '../dto/city-list-query.dto';
import { CreateCityDto } from '../dto/create-city.dto';
import { UpdateCityDto } from '../dto/update-city.dto';
import { toCityResponse } from '../mappers/city.mapper';
import {
  assertCityNotInUse,
  assertCityUniqueInState,
  assertStateExists,
  optimisticUpdate,
  throwNotFound,
} from '../utils/masters.util';

const CITY_AUDIT_FIELDS = [
  { name: 'stateId', dataType: 'bigint' },
  { name: 'cityCode' },
  { name: 'cityName' },
  { name: 'district' },
  { name: 'postalRegion' },
  { name: 'latitude', dataType: 'number' },
  { name: 'longitude', dataType: 'number' },
  { name: 'isActive', dataType: 'boolean' },
];

@Injectable()
export class CityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: CityListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.CityWhereInput = {
      deletedAt: null,
      ...(query.stateId ? { stateId: query.stateId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(search
        ? {
            OR: [
              { cityCode: { contains: search } },
              { cityName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.city.count({ where }),
      this.prisma.client.city.findMany({
        where,
        orderBy: { cityName: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toCityResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const city = await this.prisma.client.city.findFirst({
      where: { id, deletedAt: null },
    });

    if (!city) {
      throwNotFound(ErrorCode.CITY_NOT_FOUND, `City not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toCityResponse(city);
  }

  async create(dto: CreateCityDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertStateExists(tx, dto.stateId);
      await assertCityUniqueInState(tx, dto.stateId, 'cityCode', dto.cityCode);
      await assertCityUniqueInState(tx, dto.stateId, 'cityName', dto.cityName);

      const now = BigInt(Date.now());
      const city = await tx.city.create({
        data: {
          uuid: randomUUID(),
          stateId: dto.stateId,
          cityCode: dto.cityCode,
          cityName: dto.cityName,
          district: dto.district ?? null,
          postalRegion: dto.postalRegion ?? null,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        city,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toCityResponse(city);
    });
  }

  async update(id: bigint, dto: UpdateCityDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.city.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.CITY_NOT_FOUND, `City not found: ${id}`, {
          id: id.toString(),
        });
      }

      const stateId = dto.stateId ?? existing.stateId;
      if (dto.stateId) {
        await assertStateExists(tx, dto.stateId);
      }

      if (dto.cityCode && dto.cityCode !== existing.cityCode) {
        await assertCityUniqueInState(
          tx,
          stateId,
          'cityCode',
          dto.cityCode,
          id,
        );
      }
      if (dto.cityName && dto.cityName !== existing.cityName) {
        await assertCityUniqueInState(
          tx,
          stateId,
          'cityName',
          dto.cityName,
          id,
        );
      }

      const updateResult = await tx.city.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          stateId: dto.stateId,
          cityCode: dto.cityCode,
          cityName: dto.cityName,
          district: dto.district,
          postalRegion: dto.postalRegion,
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
        `City version conflict or not found: ${id}`,
      );

      const city = await tx.city.findFirstOrThrow({ where: { id } });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.CITY,
          entityId: city.id,
          entityUuid: city.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.LOOKUP,
        },
        existing as unknown as Record<string, unknown>,
        city as unknown as Record<string, unknown>,
        CITY_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.CITY,
        entityUuid: city.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: city.uuid, cityCode: city.cityCode },
      });
      return toCityResponse(city);
    });
  }

  async delete(id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.city.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.CITY_NOT_FOUND, `City not found: ${id}`, {
          id: id.toString(),
        });
      }

      await assertCityNotInUse(tx, id);

      const updateResult = await tx.city.updateMany({
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
        `City version conflict or not found: ${id}`,
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
    city: City,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.CITY,
      entityId: city.id,
      entityUuid: city.uuid,
      action,
      module: AuditModule.LOOKUP,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.CITY,
      entityUuid: city.uuid,
      operation,
      payload: { uuid: city.uuid, cityCode: city.cityCode },
    });
  }
}
