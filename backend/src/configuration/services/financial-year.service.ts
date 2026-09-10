import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { FinancialYear, Prisma } from '@prisma/client';
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
import { getTenantScope } from '../../persistence/context/tenant-scope.util';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { FinancialYearStatus } from '../constants/configuration.constants';
import { CreateFinancialYearDto } from '../dto/create-financial-year.dto';
import { FinancialYearListQueryDto } from '../dto/financial-year-list-query.dto';
import { UpdateFinancialYearDto } from '../dto/update-financial-year.dto';
import { toFinancialYearResponse } from '../mappers/financial-year.mapper';
import {
  assertBranchInCompany,
  assertFinancialYearMutable,
  assertFinancialYearNoOverlap,
  clearOtherCurrentFinancialYears,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
  validateFinancialYearDates,
} from '../utils/configuration.util';

const FINANCIAL_YEAR_AUDIT_FIELDS = [
  { name: 'financialYearCode' },
  { name: 'financialYearName' },
  { name: 'branchId', dataType: 'bigint' },
  { name: 'startDate', dataType: 'bigint' },
  { name: 'endDate', dataType: 'bigint' },
  { name: 'status' },
  { name: 'isCurrent', dataType: 'boolean' },
  { name: 'closingDate', dataType: 'bigint' },
  { name: 'remarks' },
];

@Injectable()
export class FinancialYearService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: FinancialYearListQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.FinancialYearWhereInput = {
      companyId: scope.companyId,
      deletedAt: null,
      ...(query.branchId !== undefined
        ? { branchId: query.branchId ?? null }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.isCurrent !== undefined ? { isCurrent: query.isCurrent } : {}),
      ...(search
        ? {
            OR: [
              { financialYearCode: { contains: search } },
              { financialYearName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.financialYear.count({ where }),
      this.prisma.client.financialYear.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toFinancialYearResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const financialYear = await this.prisma.client.financialYear.findFirst({
      where: { id, companyId: scope.companyId, deletedAt: null },
    });

    if (!financialYear) {
      throwNotFound(
        ErrorCode.FINANCIAL_YEAR_NOT_FOUND,
        `Financial year not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toFinancialYearResponse(financialYear);
  }

  async create(dto: CreateFinancialYearDto) {
    const scope = getTenantScope(this.requestContext);
    validateFinancialYearDates(dto.startDate, dto.endDate);

    return this.unitOfWork.run(async (tx) => {
      const branchId = dto.branchId ?? null;
      if (branchId != null) {
        await assertBranchInCompany(tx, scope.companyId, branchId);
      }

      await this.assertFinancialYearCodeUnique(
        tx,
        scope.companyId,
        dto.financialYearCode,
      );
      await assertFinancialYearNoOverlap(
        tx,
        scope.companyId,
        branchId,
        dto.startDate,
        dto.endDate,
      );

      if (dto.isCurrent) {
        await clearOtherCurrentFinancialYears(tx, scope.companyId, branchId);
      }

      const now = BigInt(Date.now());
      const financialYear = await tx.financialYear.create({
        data: {
          uuid: randomUUID(),
          companyId: scope.companyId,
          branchId,
          financialYearCode: dto.financialYearCode,
          financialYearName: dto.financialYearName,
          startDate: dto.startDate,
          endDate: dto.endDate,
          status: FinancialYearStatus.OPEN,
          isCurrent: dto.isCurrent ?? false,
          closingDate: null,
          remarks: dto.remarks ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        financialYear,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toFinancialYearResponse(financialYear);
    });
  }

  async update(id: bigint, dto: UpdateFinancialYearDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.financialYear.findFirst({
        where: { id, companyId: scope.companyId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.FINANCIAL_YEAR_NOT_FOUND,
          `Financial year not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertFinancialYearMutable(existing.status);

      const startDate = dto.startDate ?? existing.startDate;
      const endDate = dto.endDate ?? existing.endDate;
      validateFinancialYearDates(startDate, endDate);

      const branchId =
        dto.branchId !== undefined ? (dto.branchId ?? null) : existing.branchId;
      if (dto.branchId != null) {
        await assertBranchInCompany(tx, scope.companyId, dto.branchId);
      }

      if (
        dto.financialYearCode &&
        dto.financialYearCode !== existing.financialYearCode
      ) {
        await this.assertFinancialYearCodeUnique(
          tx,
          scope.companyId,
          dto.financialYearCode,
          id,
        );
      }

      if (dto.startDate || dto.endDate || dto.branchId !== undefined) {
        await assertFinancialYearNoOverlap(
          tx,
          scope.companyId,
          branchId,
          startDate,
          endDate,
          id,
        );
      }

      if (dto.isCurrent) {
        await clearOtherCurrentFinancialYears(
          tx,
          scope.companyId,
          branchId,
          id,
        );
      }

      const updateResult = await tx.financialYear.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          financialYearCode: dto.financialYearCode,
          financialYearName: dto.financialYearName,
          branchId:
            dto.branchId !== undefined ? (dto.branchId ?? null) : undefined,
          startDate: dto.startDate,
          endDate: dto.endDate,
          isCurrent: dto.isCurrent,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Financial year version conflict or not found: ${id}`,
      );

      const financialYear = await tx.financialYear.findFirstOrThrow({
        where: { id },
      });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.FINANCIAL_YEAR,
          entityId: financialYear.id,
          entityUuid: financialYear.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.CONFIGURATION,
        },
        existing as unknown as Record<string, unknown>,
        financialYear as unknown as Record<string, unknown>,
        FINANCIAL_YEAR_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.FINANCIAL_YEAR,
        entityUuid: financialYear.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: financialYear.uuid,
          financialYearCode: financialYear.financialYearCode,
        },
      });
      return toFinancialYearResponse(financialYear);
    });
  }

  async close(id: bigint, version: number) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.financialYear.findFirst({
        where: { id, companyId: scope.companyId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.FINANCIAL_YEAR_NOT_FOUND,
          `Financial year not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (existing.status !== FinancialYearStatus.OPEN) {
        throw new ApplicationException(
          ErrorCode.FINANCIAL_YEAR_CLOSED,
          `Financial year is ${existing.status} and cannot be closed`,
          HttpStatus.CONFLICT,
          { status: existing.status },
        );
      }

      const now = BigInt(Date.now());
      const updateResult = await tx.financialYear.updateMany({
        where: {
          id,
          version,
          deletedAt: null,
          status: FinancialYearStatus.OPEN,
        },
        data: {
          status: FinancialYearStatus.CLOSED,
          closingDate: now,
          isCurrent: false,
          updatedAt: now,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Financial year version conflict or not found: ${id}`,
      );

      const financialYear = await tx.financialYear.findFirstOrThrow({
        where: { id },
      });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.FINANCIAL_YEAR,
          entityId: financialYear.id,
          entityUuid: financialYear.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.CONFIGURATION,
        },
        existing as unknown as Record<string, unknown>,
        financialYear as unknown as Record<string, unknown>,
        FINANCIAL_YEAR_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.FINANCIAL_YEAR,
        entityUuid: financialYear.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: financialYear.uuid,
          financialYearCode: financialYear.financialYearCode,
          status: financialYear.status,
        },
      });
      return toFinancialYearResponse(financialYear);
    });
  }

  async delete(id: bigint, version: number) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.financialYear.findFirst({
        where: { id, companyId: scope.companyId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.FINANCIAL_YEAR_NOT_FOUND,
          `Financial year not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertFinancialYearMutable(existing.status);

      if (existing.isCurrent) {
        throwConflict(
          ErrorCode.FINANCIAL_YEAR_IN_USE,
          `Cannot delete the current financial year: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.financialYear.updateMany({
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
        `Financial year version conflict or not found: ${id}`,
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

  private async assertFinancialYearCodeUnique(
    tx: TxClient,
    companyId: bigint,
    financialYearCode: string,
    excludeId?: bigint,
  ): Promise<void> {
    const existing = await tx.financialYear.findFirst({
      where: {
        companyId,
        financialYearCode,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throwConflict(
        ErrorCode.FINANCIAL_YEAR_CONFLICT,
        `Financial year code already exists: ${financialYearCode}`,
        { financialYearCode },
      );
    }
  }

  private async emitChange(
    tx: TxClient,
    financialYear: FinancialYear,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.FINANCIAL_YEAR,
      entityId: financialYear.id,
      entityUuid: financialYear.uuid,
      action,
      module: AuditModule.CONFIGURATION,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.FINANCIAL_YEAR,
      entityUuid: financialYear.uuid,
      operation,
      payload: {
        uuid: financialYear.uuid,
        financialYearCode: financialYear.financialYearCode,
      },
    });
  }
}
