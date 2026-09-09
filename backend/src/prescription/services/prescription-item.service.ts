import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PrescriptionItem, Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { ErrorCode } from '../../common/exceptions/error-code';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { getTenantScope } from '../../persistence/context/tenant-scope.util';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { PrescriptionItemStatus } from '../constants/prescription.constants';
import {
  CreatePrescriptionItemDto,
  UpdatePrescriptionItemDto,
} from '../dto/create-prescription-item.dto';
import { ReplacePrescriptionItemsDto } from '../dto/replace-prescription-items.dto';
import { toPrescriptionItemResponse } from '../mappers/prescription-item.mapper';
import {
  assertMedicineExists,
  assertPrescriptionDraft,
  assertPrescriptionExists,
  assertUnitExists,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/prescription.util';

@Injectable()
export class PrescriptionItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(prescriptionId: bigint, query: PaginationQueryDto) {
    const scope = getTenantScope(this.requestContext);
    await this.ensurePrescriptionExists(prescriptionId, scope.branchId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.PrescriptionItemWhereInput = {
      prescriptionId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.prescriptionItem.count({ where }),
      this.prisma.client.prescriptionItem.findMany({
        where,
        orderBy: { lineNumber: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPrescriptionItemResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(prescriptionId: bigint, id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const item = await this.findActive(prescriptionId, id, scope.branchId);
    return toPrescriptionItemResponse(item);
  }

  async create(prescriptionId: bigint, dto: CreatePrescriptionItemDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const prescription = await assertPrescriptionExists(
        tx,
        prescriptionId,
        scope.branchId,
      );
      assertPrescriptionDraft(prescription.status);

      await assertMedicineExists(tx, dto.medicineId);
      await assertUnitExists(tx, dto.unitId);

      const existing = await tx.prescriptionItem.findFirst({
        where: {
          prescriptionId,
          lineNumber: dto.lineNumber,
          deletedAt: null,
        },
      });

      if (existing) {
        throwConflict(
          ErrorCode.CONFLICT,
          `Prescription item already exists for line: ${dto.lineNumber}`,
          {
            prescriptionId: prescriptionId.toString(),
            lineNumber: dto.lineNumber.toString(),
          },
        );
      }

      const now = BigInt(Date.now());
      const item = await tx.prescriptionItem.create({
        data: {
          uuid: randomUUID(),
          prescriptionId,
          medicineId: dto.medicineId,
          unitId: dto.unitId,
          lineNumber: dto.lineNumber,
          prescribedQuantity: dto.prescribedQuantity,
          dispensedQuantity: 0,
          remainingQuantity: dto.prescribedQuantity,
          dosage: dto.dosage ?? null,
          frequency: dto.frequency ?? null,
          duration: dto.duration ?? null,
          route: dto.route ?? null,
          instructions: dto.instructions ?? null,
          status: PrescriptionItemStatus.PENDING,
          remarks: dto.remarks ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        item,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toPrescriptionItemResponse(item);
    });
  }

  async update(
    prescriptionId: bigint,
    id: bigint,
    dto: UpdatePrescriptionItemDto,
  ) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const prescription = await assertPrescriptionExists(
        tx,
        prescriptionId,
        scope.branchId,
      );
      assertPrescriptionDraft(prescription.status);

      const existing = await tx.prescriptionItem.findFirst({
        where: { id, prescriptionId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PRESCRIPTION_ITEM_NOT_FOUND,
          `Prescription item not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (dto.medicineId) {
        await assertMedicineExists(tx, dto.medicineId);
      }
      if (dto.unitId) {
        await assertUnitExists(tx, dto.unitId);
      }

      const lineNumber = dto.lineNumber ?? existing.lineNumber;
      if (dto.lineNumber && dto.lineNumber !== existing.lineNumber) {
        const duplicate = await tx.prescriptionItem.findFirst({
          where: {
            prescriptionId,
            lineNumber: dto.lineNumber,
            deletedAt: null,
            NOT: { id },
          },
        });
        if (duplicate) {
          throwConflict(
            ErrorCode.CONFLICT,
            `Prescription item already exists for line: ${dto.lineNumber}`,
            { lineNumber: dto.lineNumber.toString() },
          );
        }
      }

      const prescribedQuantity =
        dto.prescribedQuantity ?? existing.prescribedQuantity;

      const updateResult = await tx.prescriptionItem.updateMany({
        where: { id, prescriptionId, version: dto.version, deletedAt: null },
        data: {
          medicineId: dto.medicineId,
          unitId: dto.unitId,
          lineNumber,
          prescribedQuantity,
          remainingQuantity: prescribedQuantity,
          dosage: dto.dosage,
          frequency: dto.frequency,
          duration: dto.duration,
          route: dto.route,
          instructions: dto.instructions,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Prescription item version conflict or not found: ${id}`,
      );

      const item = await tx.prescriptionItem.findFirstOrThrow({
        where: { id },
      });
      await this.emitChange(
        tx,
        item,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toPrescriptionItemResponse(item);
    });
  }

  async delete(prescriptionId: bigint, id: bigint, version: number) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const prescription = await assertPrescriptionExists(
        tx,
        prescriptionId,
        scope.branchId,
      );
      assertPrescriptionDraft(prescription.status);

      const existing = await tx.prescriptionItem.findFirst({
        where: { id, prescriptionId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PRESCRIPTION_ITEM_NOT_FOUND,
          `Prescription item not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.prescriptionItem.updateMany({
        where: { id, prescriptionId, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Prescription item version conflict or not found: ${id}`,
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

  async replace(prescriptionId: bigint, dto: ReplacePrescriptionItemsDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const prescription = await assertPrescriptionExists(
        tx,
        prescriptionId,
        scope.branchId,
      );
      assertPrescriptionDraft(prescription.status);

      const lineNumbers = dto.items.map((item) => item.lineNumber);
      const uniqueLines = new Set(lineNumbers);

      if (uniqueLines.size !== lineNumbers.length) {
        throwConflict(
          ErrorCode.CONFLICT,
          'Duplicate line numbers in replace payload',
          { prescriptionId: prescriptionId.toString() },
        );
      }

      for (const item of dto.items) {
        await assertMedicineExists(tx, item.medicineId);
        await assertUnitExists(tx, item.unitId);
      }

      const existingRows = await tx.prescriptionItem.findMany({
        where: { prescriptionId, deletedAt: null },
      });

      for (const row of existingRows) {
        await tx.prescriptionItem.update({
          where: { id: row.id },
          data: {
            deletedAt: BigInt(Date.now()),
            updatedAt: BigInt(Date.now()),
            version: { increment: 1 },
          },
        });
        await this.outboxService.enqueue(tx, {
          entityType: OutboxEntityType.PRESCRIPTION_ITEM,
          entityUuid: row.uuid,
          operation: OutboxOperation.DELETE,
          payload: {
            uuid: row.uuid,
            prescriptionId: prescriptionId.toString(),
          },
        });
      }

      const now = BigInt(Date.now());
      const results: PrescriptionItem[] = [];

      for (const item of dto.items) {
        const prescriptionItem = await tx.prescriptionItem.create({
          data: {
            uuid: randomUUID(),
            prescriptionId,
            medicineId: item.medicineId,
            unitId: item.unitId,
            lineNumber: item.lineNumber,
            prescribedQuantity: item.prescribedQuantity,
            dispensedQuantity: 0,
            remainingQuantity: item.prescribedQuantity,
            dosage: item.dosage ?? null,
            frequency: item.frequency ?? null,
            duration: item.duration ?? null,
            route: item.route ?? null,
            instructions: item.instructions ?? null,
            status: PrescriptionItemStatus.PENDING,
            remarks: item.remarks ?? null,
            createdAt: now,
            updatedAt: now,
          },
        });
        results.push(prescriptionItem);
      }

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PRESCRIPTION_ITEM,
        entityId: prescriptionId,
        action: AuditAction.UPDATE,
        module: AuditModule.PRESCRIPTION,
        description: `Replaced prescription items for prescription ${prescriptionId}`,
      });

      for (const prescriptionItem of results) {
        await this.outboxService.enqueue(tx, {
          entityType: OutboxEntityType.PRESCRIPTION_ITEM,
          entityUuid: prescriptionItem.uuid,
          operation: OutboxOperation.CREATE,
          payload: {
            uuid: prescriptionItem.uuid,
            prescriptionId: prescriptionId.toString(),
          },
        });
      }

      return results.map(toPrescriptionItemResponse);
    });
  }

  private async ensurePrescriptionExists(
    prescriptionId: bigint,
    branchId: bigint,
  ) {
    const prescription = await this.prisma.client.prescription.findFirst({
      where: { id: prescriptionId, branchId, deletedAt: null },
      select: { id: true },
    });

    if (!prescription) {
      throwNotFound(
        ErrorCode.PRESCRIPTION_NOT_FOUND,
        `Prescription not found: ${prescriptionId}`,
        { id: prescriptionId.toString() },
      );
    }
  }

  private async findActive(
    prescriptionId: bigint,
    id: bigint,
    branchId: bigint,
  ) {
    await this.ensurePrescriptionExists(prescriptionId, branchId);

    const item = await this.prisma.client.prescriptionItem.findFirst({
      where: { id, prescriptionId, deletedAt: null },
    });

    if (!item) {
      throwNotFound(
        ErrorCode.PRESCRIPTION_ITEM_NOT_FOUND,
        `Prescription item not found: ${id}`,
        { id: id.toString() },
      );
    }

    return item;
  }

  private async emitChange(
    tx: TxClient,
    item: PrescriptionItem,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.PRESCRIPTION_ITEM,
      entityId: item.id,
      entityUuid: item.uuid,
      action,
      module: AuditModule.PRESCRIPTION,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.PRESCRIPTION_ITEM,
      entityUuid: item.uuid,
      operation,
      payload: {
        uuid: item.uuid,
        prescriptionId: item.prescriptionId.toString(),
      },
    });
  }
}
