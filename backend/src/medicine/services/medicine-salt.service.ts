import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { MedicineSalt, Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import {
  CreateMedicineSaltDto,
  UpdateMedicineSaltDto,
} from '../dto/create-medicine-salt.dto';
import { ReplaceMedicineSaltsDto } from '../dto/replace-medicine-salts.dto';
import { toMedicineSaltResponse } from '../mappers/medicine-salt.mapper';
import {
  assertMedicineExists,
  assertSaltCompositionExists,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/medicine.util';

@Injectable()
export class MedicineSaltService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(medicineId: bigint, query: PaginationQueryDto) {
    await assertMedicineExists(this.prisma.client, medicineId, false);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.MedicineSaltWhereInput = { medicineId };

    const [total, rows] = await Promise.all([
      this.prisma.client.medicineSalt.count({ where }),
      this.prisma.client.medicineSalt.findMany({
        where,
        orderBy: { sequenceNo: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toMedicineSaltResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(medicineId: bigint, id: bigint) {
    const medicineSalt = await this.findActive(medicineId, id);
    return toMedicineSaltResponse(medicineSalt);
  }

  async create(medicineId: bigint, dto: CreateMedicineSaltDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertMedicineExists(tx, medicineId);

      const saltComposition = await assertSaltCompositionExists(
        tx,
        dto.saltCompositionId,
      );

      const existing = await tx.medicineSalt.findFirst({
        where: { medicineId, saltCompositionId: dto.saltCompositionId },
      });

      if (existing) {
        throwConflict(
          ErrorCode.CONFLICT,
          `Medicine salt already exists for composition: ${dto.saltCompositionId}`,
          {
            medicineId: medicineId.toString(),
            saltCompositionId: dto.saltCompositionId.toString(),
          },
        );
      }

      const medicineSalt = await tx.medicineSalt.create({
        data: {
          uuid: randomUUID(),
          medicineId,
          saltCompositionId: dto.saltCompositionId,
          medicineGenericId: saltComposition.genericId,
          sequenceNo: dto.sequenceNo,
          percentage: dto.percentage ?? null,
        },
      });

      await this.emitChange(
        tx,
        medicineSalt,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toMedicineSaltResponse(medicineSalt);
    });
  }

  async update(medicineId: bigint, id: bigint, dto: UpdateMedicineSaltDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertMedicineExists(tx, medicineId);

      const existing = await tx.medicineSalt.findFirst({
        where: { id, medicineId },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.MEDICINE_SALT_NOT_FOUND,
          `Medicine salt not found: ${id}`,
          { id: id.toString() },
        );
      }

      let medicineGenericId = existing.medicineGenericId;
      const saltCompositionId =
        dto.saltCompositionId ?? existing.saltCompositionId;

      if (dto.saltCompositionId) {
        const saltComposition = await assertSaltCompositionExists(
          tx,
          dto.saltCompositionId,
        );
        medicineGenericId = saltComposition.genericId;

        if (dto.saltCompositionId !== existing.saltCompositionId) {
          const duplicate = await tx.medicineSalt.findFirst({
            where: {
              medicineId,
              saltCompositionId: dto.saltCompositionId,
              NOT: { id },
            },
          });

          if (duplicate) {
            throwConflict(
              ErrorCode.CONFLICT,
              `Medicine salt already exists for composition: ${dto.saltCompositionId}`,
              { saltCompositionId: dto.saltCompositionId.toString() },
            );
          }
        }
      }

      const updateResult = await tx.medicineSalt.updateMany({
        where: { id, medicineId, version: dto.version },
        data: {
          saltCompositionId,
          medicineGenericId,
          ...(dto.sequenceNo !== undefined
            ? { sequenceNo: dto.sequenceNo }
            : {}),
          ...(dto.percentage !== undefined
            ? { percentage: dto.percentage }
            : {}),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Medicine salt version conflict or not found: ${id}`,
      );

      const medicineSalt = await tx.medicineSalt.findFirstOrThrow({
        where: { id },
      });
      await this.emitChange(
        tx,
        medicineSalt,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toMedicineSaltResponse(medicineSalt);
    });
  }

  async delete(medicineId: bigint, id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      await assertMedicineExists(tx, medicineId);

      const existing = await tx.medicineSalt.findFirst({
        where: { id, medicineId, version },
      });

      if (!existing) {
        const found = await tx.medicineSalt.findFirst({
          where: { id, medicineId },
        });

        if (!found) {
          throwNotFound(
            ErrorCode.MEDICINE_SALT_NOT_FOUND,
            `Medicine salt not found: ${id}`,
            { id: id.toString() },
          );
        }

        throw new ApplicationException(
          ErrorCode.ENTITY_VERSION_CONFLICT,
          `Medicine salt version conflict or not found: ${id}`,
          HttpStatus.CONFLICT,
          { id: id.toString() },
        );
      }

      await tx.medicineSalt.delete({ where: { id } });

      await this.emitChange(
        tx,
        existing,
        AuditAction.DELETE,
        OutboxOperation.DELETE,
      );
      return { id: id.toString(), deleted: true };
    });
  }

  async replace(medicineId: bigint, dto: ReplaceMedicineSaltsDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertMedicineExists(tx, medicineId);

      if (dto.items.length === 0 && dto.confirmClear !== true) {
        throw new ApplicationException(
          ErrorCode.VALIDATION_ERROR,
          'confirmClear is required to remove all medicine salts',
          HttpStatus.BAD_REQUEST,
          { medicineId: medicineId.toString() },
        );
      }

      const compositionIds = dto.items.map((item) => item.saltCompositionId);
      const uniqueCompositionIds = new Set(
        compositionIds.map((id) => id.toString()),
      );

      if (uniqueCompositionIds.size !== compositionIds.length) {
        throwConflict(
          ErrorCode.CONFLICT,
          'Duplicate salt composition IDs in replace payload',
          { medicineId: medicineId.toString() },
        );
      }

      const compositionMap = new Map<string, bigint>();
      for (const item of dto.items) {
        const saltComposition = await assertSaltCompositionExists(
          tx,
          item.saltCompositionId,
        );
        compositionMap.set(
          item.saltCompositionId.toString(),
          saltComposition.genericId,
        );
      }

      const existingRows = await tx.medicineSalt.findMany({
        where: { medicineId },
      });

      for (const row of existingRows) {
        await tx.medicineSalt.delete({ where: { id: row.id } });
        await this.outboxService.enqueue(tx, {
          entityType: OutboxEntityType.MEDICINE_SALT,
          entityUuid: row.uuid,
          operation: OutboxOperation.DELETE,
          payload: { uuid: row.uuid, medicineId: medicineId.toString() },
        });
      }

      const results: MedicineSalt[] = [];
      for (const item of dto.items) {
        const medicineSalt = await tx.medicineSalt.create({
          data: {
            uuid: randomUUID(),
            medicineId,
            saltCompositionId: item.saltCompositionId,
            medicineGenericId:
              compositionMap.get(item.saltCompositionId.toString()) ?? null,
            sequenceNo: item.sequenceNo,
            percentage: item.percentage ?? null,
          },
        });
        results.push(medicineSalt);
      }

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.MEDICINE_SALT,
        entityId: medicineId,
        action: AuditAction.UPDATE,
        module: AuditModule.MEDICINE,
        description: `Replaced medicine salts for medicine ${medicineId}`,
      });

      for (const medicineSalt of results) {
        await this.outboxService.enqueue(tx, {
          entityType: OutboxEntityType.MEDICINE_SALT,
          entityUuid: medicineSalt.uuid,
          operation: OutboxOperation.CREATE,
          payload: {
            uuid: medicineSalt.uuid,
            medicineId: medicineId.toString(),
          },
        });
      }

      return results.map(toMedicineSaltResponse);
    });
  }

  private async findActive(medicineId: bigint, id: bigint) {
    const medicineSalt = await this.prisma.client.medicineSalt.findFirst({
      where: { id, medicineId },
    });

    if (!medicineSalt) {
      throwNotFound(
        ErrorCode.MEDICINE_SALT_NOT_FOUND,
        `Medicine salt not found: ${id}`,
        { id: id.toString() },
      );
    }

    return medicineSalt;
  }

  private async emitChange(
    tx: TxClient,
    medicineSalt: MedicineSalt,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.MEDICINE_SALT,
      entityId: medicineSalt.id,
      entityUuid: medicineSalt.uuid,
      action,
      module: AuditModule.MEDICINE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.MEDICINE_SALT,
      entityUuid: medicineSalt.uuid,
      operation,
      payload: {
        uuid: medicineSalt.uuid,
        medicineId: medicineSalt.medicineId.toString(),
      },
    });
  }
}
