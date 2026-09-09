import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma, SaltComposition } from '@prisma/client';
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
import { CreateSaltCompositionDto } from '../dto/create-salt-composition.dto';
import { SaltCompositionListQueryDto } from '../dto/salt-composition-list-query.dto';
import { UpdateSaltCompositionDto } from '../dto/update-salt-composition.dto';
import { toSaltCompositionResponse } from '../mappers/salt-composition.mapper';
import {
  assertGenericExists,
  assertSaltCompositionNotInUse,
  assertUniqueActiveField,
  assertUnitExists,
  optimisticUpdate,
  throwNotFound,
} from '../utils/medicine.util';

@Injectable()
export class SaltCompositionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: SaltCompositionListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const genericId = query.genericId ? BigInt(query.genericId) : undefined;

    const where: Prisma.SaltCompositionWhereInput = {
      deletedAt: null,
      ...(genericId !== undefined ? { genericId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(search
        ? {
            OR: [
              { compositionCode: { contains: search } },
              { strengthUnit: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.saltComposition.count({ where }),
      this.prisma.client.saltComposition.findMany({
        where,
        orderBy: { compositionCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toSaltCompositionResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const saltComposition = await this.prisma.client.saltComposition.findFirst({
      where: { id, deletedAt: null },
    });

    if (!saltComposition) {
      throwNotFound(
        ErrorCode.SALT_COMPOSITION_NOT_FOUND,
        `Salt composition not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toSaltCompositionResponse(saltComposition);
  }

  async create(dto: CreateSaltCompositionDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertGenericExists(tx, dto.genericId);
      await assertUnitExists(tx, dto.unitId);
      await assertUniqueActiveField(
        tx,
        'saltComposition',
        'compositionCode',
        dto.compositionCode,
        'Composition code',
      );

      const now = BigInt(Date.now());
      const saltComposition = await tx.saltComposition.create({
        data: {
          uuid: randomUUID(),
          genericId: dto.genericId,
          unitId: dto.unitId,
          compositionCode: dto.compositionCode,
          strength: dto.strength,
          strengthUnit: dto.strengthUnit,
          description: dto.description,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        saltComposition,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toSaltCompositionResponse(saltComposition);
    });
  }

  async update(id: bigint, dto: UpdateSaltCompositionDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.saltComposition.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.SALT_COMPOSITION_NOT_FOUND,
          `Salt composition not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (dto.genericId) {
        await assertGenericExists(tx, dto.genericId);
      }

      if (dto.unitId) {
        await assertUnitExists(tx, dto.unitId);
      }

      if (
        dto.compositionCode &&
        dto.compositionCode !== existing.compositionCode
      ) {
        await assertUniqueActiveField(
          tx,
          'saltComposition',
          'compositionCode',
          dto.compositionCode,
          'Composition code',
          id,
        );
      }

      const updateResult = await tx.saltComposition.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          genericId: dto.genericId,
          unitId: dto.unitId,
          compositionCode: dto.compositionCode,
          strength: dto.strength,
          strengthUnit: dto.strengthUnit,
          description: dto.description,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Salt composition version conflict or not found: ${id}`,
      );

      const saltComposition = await tx.saltComposition.findFirstOrThrow({
        where: { id },
      });
      await this.emitChange(
        tx,
        saltComposition,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toSaltCompositionResponse(saltComposition);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.saltComposition.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.SALT_COMPOSITION_NOT_FOUND,
          `Salt composition not found: ${id}`,
          { id: id.toString() },
        );
      }

      await assertSaltCompositionNotInUse(tx, id);

      const updateResult = await tx.saltComposition.updateMany({
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
        `Salt composition version conflict or not found: ${id}`,
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
    saltComposition: SaltComposition,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.SALT_COMPOSITION,
      entityId: saltComposition.id,
      entityUuid: saltComposition.uuid,
      action,
      module: AuditModule.MEDICINE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.SALT_COMPOSITION,
      entityUuid: saltComposition.uuid,
      operation,
      payload: {
        uuid: saltComposition.uuid,
        compositionCode: saltComposition.compositionCode,
      },
    });
  }
}
