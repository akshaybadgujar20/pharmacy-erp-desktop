import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma, State } from '@prisma/client';
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
import { CreateStateDto } from '../dto/create-state.dto';
import { StateListQueryDto } from '../dto/state-list-query.dto';
import { UpdateStateDto } from '../dto/update-state.dto';
import { toStateResponse } from '../mappers/state.mapper';
import {
  assertCountryExists,
  assertStateNotInUse,
  assertStateUniqueInCountry,
  optimisticUpdate,
  throwNotFound,
} from '../utils/masters.util';

const STATE_AUDIT_FIELDS = [
  { name: 'countryId', dataType: 'bigint' },
  { name: 'stateCode' },
  { name: 'stateName' },
  { name: 'gstStateCode' },
  { name: 'isoCode' },
  { name: 'isActive', dataType: 'boolean' },
];

@Injectable()
export class StateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: StateListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.StateWhereInput = {
      deletedAt: null,
      ...(query.countryId ? { countryId: query.countryId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(search
        ? {
            OR: [
              { stateCode: { contains: search } },
              { stateName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.state.count({ where }),
      this.prisma.client.state.findMany({
        where,
        orderBy: { stateName: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toStateResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const state = await this.prisma.client.state.findFirst({
      where: { id, deletedAt: null },
    });

    if (!state) {
      throwNotFound(ErrorCode.STATE_NOT_FOUND, `State not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toStateResponse(state);
  }

  async create(dto: CreateStateDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertCountryExists(tx, dto.countryId);
      await assertStateUniqueInCountry(
        tx,
        dto.countryId,
        'stateCode',
        dto.stateCode,
      );
      await assertStateUniqueInCountry(
        tx,
        dto.countryId,
        'stateName',
        dto.stateName,
      );

      const now = BigInt(Date.now());
      const state = await tx.state.create({
        data: {
          uuid: randomUUID(),
          countryId: dto.countryId,
          stateCode: dto.stateCode,
          stateName: dto.stateName,
          gstStateCode: dto.gstStateCode ?? null,
          isoCode: dto.isoCode ?? null,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        state,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toStateResponse(state);
    });
  }

  async update(id: bigint, dto: UpdateStateDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.state.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.STATE_NOT_FOUND, `State not found: ${id}`, {
          id: id.toString(),
        });
      }

      const countryId = dto.countryId ?? existing.countryId;
      if (dto.countryId) {
        await assertCountryExists(tx, dto.countryId);
      }

      if (dto.stateCode && dto.stateCode !== existing.stateCode) {
        await assertStateUniqueInCountry(
          tx,
          countryId,
          'stateCode',
          dto.stateCode,
          id,
        );
      }
      if (dto.stateName && dto.stateName !== existing.stateName) {
        await assertStateUniqueInCountry(
          tx,
          countryId,
          'stateName',
          dto.stateName,
          id,
        );
      }

      const updateResult = await tx.state.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          countryId: dto.countryId,
          stateCode: dto.stateCode,
          stateName: dto.stateName,
          gstStateCode: dto.gstStateCode,
          isoCode: dto.isoCode,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `State version conflict or not found: ${id}`,
      );

      const state = await tx.state.findFirstOrThrow({ where: { id } });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.STATE,
          entityId: state.id,
          entityUuid: state.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.LOOKUP,
        },
        existing as unknown as Record<string, unknown>,
        state as unknown as Record<string, unknown>,
        STATE_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STATE,
        entityUuid: state.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: state.uuid, stateCode: state.stateCode },
      });
      return toStateResponse(state);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.state.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.STATE_NOT_FOUND, `State not found: ${id}`, {
          id: id.toString(),
        });
      }

      await assertStateNotInUse(tx, id);

      const updateResult = await tx.state.updateMany({
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
        `State version conflict or not found: ${id}`,
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
    state: State,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.STATE,
      entityId: state.id,
      entityUuid: state.uuid,
      action,
      module: AuditModule.LOOKUP,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.STATE,
      entityUuid: state.uuid,
      operation,
      payload: { uuid: state.uuid, stateCode: state.stateCode },
    });
  }
}
