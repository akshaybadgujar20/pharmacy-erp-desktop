import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
import { RequestContextService } from '../../persistence/context/request-context.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { BatchListQueryDto } from '../dto/batch-list-query.dto';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { UpdateBatchDto } from '../dto/update-batch.dto';
import { toBatchResponse } from '../mappers/batch.mapper';
import {
  assertMedicineExists,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/inventory.util';

@Injectable()
export class BatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: BatchListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const medicineId = query.medicineId ? BigInt(query.medicineId) : undefined;

    const where: Prisma.BatchWhereInput = {
      deletedAt: null,
      ...(medicineId ? { medicineId } : {}),
      ...(search ? { batchNumber: { contains: search } } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.batch.count({ where }),
      this.prisma.client.batch.findMany({
        where,
        orderBy: { batchNumber: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toBatchResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const batch = await this.prisma.client.batch.findFirst({
      where: { id, deletedAt: null },
    });

    if (!batch) {
      throwNotFound(ErrorCode.BATCH_NOT_FOUND, `Batch not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toBatchResponse(batch);
  }

  async create(dto: CreateBatchDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertMedicineExists(tx, dto.medicineId);

      const existing = await tx.batch.findFirst({
        where: {
          medicineId: dto.medicineId,
          batchNumber: dto.batchNumber,
          deletedAt: null,
        },
      });

      if (existing) {
        throwConflict(
          `Batch already exists for medicine: ${dto.batchNumber}`,
          {
            medicineId: dto.medicineId.toString(),
            batchNumber: dto.batchNumber,
          },
          ErrorCode.BATCH_ALREADY_EXISTS,
        );
      }

      const now = BigInt(Date.now());
      const batch = await tx.batch.create({
        data: {
          uuid: randomUUID(),
          medicineId: dto.medicineId,
          batchNumber: dto.batchNumber,
          manufacturingDate: dto.manufacturingDate,
          expiryDate: dto.expiryDate,
          purchaseRate: dto.purchaseRate,
          mrp: dto.mrp,
          barcode: dto.barcode,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
          updatedBy: this.requestContext.tryGet()?.userId,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.BATCH,
        entityId: batch.id,
        entityUuid: batch.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.BATCH,
        entityUuid: batch.uuid,
        operation: OutboxOperation.CREATE,
        payload: { uuid: batch.uuid, batchNumber: batch.batchNumber },
      });

      return toBatchResponse(batch);
    });
  }

  async update(id: bigint, dto: UpdateBatchDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.batch.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.BATCH_NOT_FOUND, `Batch not found: ${id}`, {
          id: id.toString(),
        });
      }

      const medicineId = dto.medicineId ?? existing.medicineId;
      const batchNumber = dto.batchNumber ?? existing.batchNumber;

      if (dto.medicineId) {
        await assertMedicineExists(tx, dto.medicineId);
      }

      if (dto.medicineId !== undefined || dto.batchNumber !== undefined) {
        const duplicate = await tx.batch.findFirst({
          where: {
            medicineId,
            batchNumber,
            deletedAt: null,
            NOT: { id },
          },
        });

        if (duplicate) {
          throwConflict(
            `Batch already exists for medicine: ${batchNumber}`,
            {
              medicineId: medicineId.toString(),
              batchNumber,
            },
            ErrorCode.BATCH_ALREADY_EXISTS,
          );
        }
      }

      const updateResult = await tx.batch.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          medicineId: dto.medicineId,
          batchNumber: dto.batchNumber,
          manufacturingDate: dto.manufacturingDate,
          expiryDate: dto.expiryDate,
          purchaseRate: dto.purchaseRate,
          mrp: dto.mrp,
          barcode: dto.barcode,
          isActive: dto.isActive,
          updatedBy: this.requestContext.tryGet()?.userId,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Batch version conflict or not found: ${id}`,
      );

      const batch = await tx.batch.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.BATCH,
        entityId: batch.id,
        entityUuid: batch.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.BATCH,
        entityUuid: batch.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: batch.uuid, batchNumber: batch.batchNumber },
      });

      return toBatchResponse(batch);
    });
  }

  async delete(id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.batch.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.BATCH_NOT_FOUND, `Batch not found: ${id}`, {
          id: id.toString(),
        });
      }

      const activeStock = await tx.stock.findFirst({
        where: { batchId: id, deletedAt: null, availableQuantity: { gt: 0 } },
      });

      if (activeStock) {
        throwConflict('Cannot delete batch with active stock balance', {
          batchId: id.toString(),
        });
      }

      const updateResult = await tx.batch.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          deletedBy: this.requestContext.tryGet()?.userId,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Batch version conflict or not found: ${id}`,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.BATCH,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.BATCH,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }
}
