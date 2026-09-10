import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prescription, Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { auditAndLogChanges } from '../../audit/utils/audit.util';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import {
  getTenantScope,
  withBranchScope,
} from '../../persistence/context/tenant-scope.util';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { PrescriptionStatus } from '../constants/prescription.constants';
import { CreatePrescriptionDto } from '../dto/create-prescription.dto';
import { PrescriptionListQueryDto } from '../dto/prescription-list-query.dto';
import { PrescriptionWorkflowDto } from '../dto/prescription-workflow.dto';
import { UpdatePrescriptionDto } from '../dto/update-prescription.dto';
import { toPrescriptionResponse } from '../mappers/prescription.mapper';
import {
  assertCustomerExists,
  assertDoctorExists,
  assertPrescriptionActivatable,
  assertPrescriptionCancellable,
  assertPrescriptionDraft,
  assertPrescriptionExpirable,
  assertPrescriptionNotInUse,
  assertPrescriptionNumberUnique,
  optimisticUpdate,
  throwNotFound,
} from '../utils/prescription.util';

const PRESCRIPTION_AUDIT_FIELDS = [
  { name: 'prescriptionNumber' },
  { name: 'customerId', dataType: 'bigint' },
  { name: 'doctorId', dataType: 'bigint' },
  { name: 'prescriptionDate', dataType: 'bigint' },
  { name: 'validUntil', dataType: 'bigint' },
  { name: 'diagnosis' },
  { name: 'symptoms' },
  { name: 'visitNumber' },
  { name: 'status' },
  { name: 'remarks' },
];

@Injectable()
export class PrescriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: PrescriptionListQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.PrescriptionWhereInput = withBranchScope(scope, {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.doctorId ? { doctorId: query.doctorId } : {}),
      ...(search
        ? {
            OR: [
              { prescriptionNumber: { contains: search } },
              { diagnosis: { contains: search } },
            ],
          }
        : {}),
    });

    const [total, rows] = await Promise.all([
      this.prisma.client.prescription.count({ where }),
      this.prisma.client.prescription.findMany({
        where,
        orderBy: { prescriptionDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPrescriptionResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const prescription = await this.prisma.client.prescription.findFirst({
      where: withBranchScope(scope, { id, deletedAt: null }),
    });

    if (!prescription) {
      throwNotFound(
        ErrorCode.PRESCRIPTION_NOT_FOUND,
        `Prescription not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toPrescriptionResponse(prescription);
  }

  async create(dto: CreatePrescriptionDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      await assertPrescriptionNumberUnique(tx, dto.prescriptionNumber);
      await assertCustomerExists(tx, dto.customerId);
      await assertDoctorExists(tx, dto.doctorId);

      const now = BigInt(Date.now());
      const prescription = await tx.prescription.create({
        data: {
          uuid: randomUUID(),
          prescriptionNumber: dto.prescriptionNumber,
          customerId: dto.customerId,
          doctorId: dto.doctorId,
          branchId: scope.branchId,
          prescriptionDate: dto.prescriptionDate,
          validUntil: dto.validUntil ?? null,
          diagnosis: dto.diagnosis ?? null,
          symptoms: dto.symptoms ?? null,
          visitNumber: dto.visitNumber ?? null,
          status: PrescriptionStatus.DRAFT,
          remarks: dto.remarks ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        prescription,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toPrescriptionResponse(prescription);
    });
  }

  async update(id: bigint, dto: UpdatePrescriptionDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.prescription.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PRESCRIPTION_NOT_FOUND,
          `Prescription not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertPrescriptionDraft(existing.status);

      if (
        dto.prescriptionNumber &&
        dto.prescriptionNumber !== existing.prescriptionNumber
      ) {
        await assertPrescriptionNumberUnique(tx, dto.prescriptionNumber, id);
      }

      if (dto.customerId) {
        await assertCustomerExists(tx, dto.customerId);
      }
      if (dto.doctorId) {
        await assertDoctorExists(tx, dto.doctorId);
      }

      const updateResult = await tx.prescription.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          prescriptionNumber: dto.prescriptionNumber,
          customerId: dto.customerId,
          doctorId: dto.doctorId,
          prescriptionDate: dto.prescriptionDate,
          validUntil: dto.validUntil,
          diagnosis: dto.diagnosis,
          symptoms: dto.symptoms,
          visitNumber: dto.visitNumber,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Prescription version conflict or not found: ${id}`,
      );

      const prescription = await tx.prescription.findFirstOrThrow({
        where: { id },
      });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.PRESCRIPTION,
          entityId: prescription.id,
          entityUuid: prescription.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.PRESCRIPTION,
        },
        existing as unknown as Record<string, unknown>,
        prescription as unknown as Record<string, unknown>,
        PRESCRIPTION_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PRESCRIPTION,
        entityUuid: prescription.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: prescription.uuid,
          prescriptionNumber: prescription.prescriptionNumber,
        },
      });
      return toPrescriptionResponse(prescription);
    });
  }

  async delete(id: bigint, version: number) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.prescription.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PRESCRIPTION_NOT_FOUND,
          `Prescription not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertPrescriptionDraft(existing.status);
      await assertPrescriptionNotInUse(tx, id);

      const updateResult = await tx.prescription.updateMany({
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
        `Prescription version conflict or not found: ${id}`,
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

  async activate(id: bigint, dto: PrescriptionWorkflowDto) {
    return this.transitionStatus(
      id,
      dto,
      PrescriptionStatus.ACTIVE,
      assertPrescriptionActivatable,
      AuditAction.UPDATE,
    );
  }

  async cancel(id: bigint, dto: PrescriptionWorkflowDto) {
    return this.transitionStatus(
      id,
      dto,
      PrescriptionStatus.CANCELLED,
      assertPrescriptionCancellable,
      AuditAction.UPDATE,
    );
  }

  async expire(id: bigint, dto: PrescriptionWorkflowDto) {
    return this.transitionStatus(
      id,
      dto,
      PrescriptionStatus.EXPIRED,
      assertPrescriptionExpirable,
      AuditAction.UPDATE,
    );
  }

  private async transitionStatus(
    id: bigint,
    dto: PrescriptionWorkflowDto,
    targetStatus: string,
    guard: (status: string) => void,
    action: (typeof AuditAction)[keyof typeof AuditAction],
  ) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.prescription.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PRESCRIPTION_NOT_FOUND,
          `Prescription not found: ${id}`,
          { id: id.toString() },
        );
      }

      guard(existing.status);

      if (targetStatus === PrescriptionStatus.ACTIVE) {
        const itemCount = await tx.prescriptionItem.count({
          where: { prescriptionId: id, deletedAt: null },
        });

        if (itemCount === 0) {
          throw new ApplicationException(
            ErrorCode.DOCUMENT_HAS_NO_ITEMS,
            'Prescription must have at least one item',
            HttpStatus.BAD_REQUEST,
            { id: id.toString() },
          );
        }
      }

      const updateResult = await tx.prescription.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: targetStatus,
          remarks: dto.remarks ?? existing.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Prescription version conflict or not found: ${id}`,
      );

      const prescription = await tx.prescription.findFirstOrThrow({
        where: { id },
      });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.PRESCRIPTION,
          entityId: prescription.id,
          entityUuid: prescription.uuid,
          action,
          module: AuditModule.PRESCRIPTION,
        },
        existing as unknown as Record<string, unknown>,
        prescription as unknown as Record<string, unknown>,
        PRESCRIPTION_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PRESCRIPTION,
        entityUuid: prescription.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: prescription.uuid,
          prescriptionNumber: prescription.prescriptionNumber,
        },
      });
      return toPrescriptionResponse(prescription);
    });
  }

  private async emitChange(
    tx: TxClient,
    prescription: Prescription,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.PRESCRIPTION,
      entityId: prescription.id,
      entityUuid: prescription.uuid,
      action,
      module: AuditModule.PRESCRIPTION,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.PRESCRIPTION,
      entityUuid: prescription.uuid,
      operation,
      payload: {
        uuid: prescription.uuid,
        prescriptionNumber: prescription.prescriptionNumber,
      },
    });
  }
}
