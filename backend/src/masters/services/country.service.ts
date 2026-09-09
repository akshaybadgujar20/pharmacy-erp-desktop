import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Country, Prisma } from '@prisma/client';
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
import { CountryListQueryDto } from '../dto/country-list-query.dto';
import { CreateCountryDto } from '../dto/create-country.dto';
import { UpdateCountryDto } from '../dto/update-country.dto';
import { toCountryResponse } from '../mappers/country.mapper';
import {
  assertCountryNotInUse,
  assertCountryUniqueField,
  optimisticUpdate,
  throwNotFound,
} from '../utils/masters.util';

const COUNTRY_AUDIT_FIELDS = [
  { name: 'countryCode' },
  { name: 'isoAlpha2' },
  { name: 'isoAlpha3' },
  { name: 'countryName' },
  { name: 'nationality' },
  { name: 'phoneCode' },
  { name: 'currencyCode' },
  { name: 'timezone' },
  { name: 'isActive', dataType: 'boolean' },
];

@Injectable()
export class CountryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: CountryListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.CountryWhereInput = {
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(search
        ? {
            OR: [
              { countryCode: { contains: search } },
              { countryName: { contains: search } },
              { isoAlpha2: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.country.count({ where }),
      this.prisma.client.country.findMany({
        where,
        orderBy: { countryName: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toCountryResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const country = await this.prisma.client.country.findFirst({
      where: { id, deletedAt: null },
    });

    if (!country) {
      throwNotFound(ErrorCode.COUNTRY_NOT_FOUND, `Country not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toCountryResponse(country);
  }

  async create(dto: CreateCountryDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertCountryUniqueField(tx, 'countryCode', dto.countryCode);
      await assertCountryUniqueField(tx, 'isoAlpha2', dto.isoAlpha2);
      await assertCountryUniqueField(tx, 'isoAlpha3', dto.isoAlpha3);

      const now = BigInt(Date.now());
      const country = await tx.country.create({
        data: {
          uuid: randomUUID(),
          countryCode: dto.countryCode,
          isoAlpha2: dto.isoAlpha2,
          isoAlpha3: dto.isoAlpha3,
          countryName: dto.countryName,
          nationality: dto.nationality ?? null,
          phoneCode: dto.phoneCode ?? null,
          currencyCode: dto.currencyCode ?? null,
          timezone: dto.timezone ?? null,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        country,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toCountryResponse(country);
    });
  }

  async update(id: bigint, dto: UpdateCountryDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.country.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.COUNTRY_NOT_FOUND, `Country not found: ${id}`, {
          id: id.toString(),
        });
      }

      if (dto.countryCode && dto.countryCode !== existing.countryCode) {
        await assertCountryUniqueField(tx, 'countryCode', dto.countryCode, id);
      }
      if (dto.isoAlpha2 && dto.isoAlpha2 !== existing.isoAlpha2) {
        await assertCountryUniqueField(tx, 'isoAlpha2', dto.isoAlpha2, id);
      }
      if (dto.isoAlpha3 && dto.isoAlpha3 !== existing.isoAlpha3) {
        await assertCountryUniqueField(tx, 'isoAlpha3', dto.isoAlpha3, id);
      }

      const updateResult = await tx.country.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          countryCode: dto.countryCode,
          isoAlpha2: dto.isoAlpha2,
          isoAlpha3: dto.isoAlpha3,
          countryName: dto.countryName,
          nationality: dto.nationality,
          phoneCode: dto.phoneCode,
          currencyCode: dto.currencyCode,
          timezone: dto.timezone,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Country version conflict or not found: ${id}`,
      );

      const country = await tx.country.findFirstOrThrow({ where: { id } });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.COUNTRY,
          entityId: country.id,
          entityUuid: country.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.LOOKUP,
        },
        existing as unknown as Record<string, unknown>,
        country as unknown as Record<string, unknown>,
        COUNTRY_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.COUNTRY,
        entityUuid: country.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: country.uuid, countryCode: country.countryCode },
      });
      return toCountryResponse(country);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.country.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.COUNTRY_NOT_FOUND, `Country not found: ${id}`, {
          id: id.toString(),
        });
      }

      await assertCountryNotInUse(tx, id);

      const updateResult = await tx.country.updateMany({
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
        `Country version conflict or not found: ${id}`,
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
    country: Country,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.COUNTRY,
      entityId: country.id,
      entityUuid: country.uuid,
      action,
      module: AuditModule.LOOKUP,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.COUNTRY,
      entityUuid: country.uuid,
      operation,
      payload: { uuid: country.uuid, countryCode: country.countryCode },
    });
  }
}
