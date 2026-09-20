import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Branch, Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { auditAndLogChanges } from '../../audit/utils/audit.util';
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
import { CreateBranchDto } from '../dto/create-branch.dto';
import { BranchListQueryDto } from '../dto/branch-list-query.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { toBranchResponse } from '../mappers/branch.mapper';
import {
  assertBranchNotInUse,
  assertCompanyExists,
  clearOtherHeadOffices,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/configuration.util';

const BRANCH_AUDIT_FIELDS = [
  { name: 'branchCode' },
  { name: 'branchName' },
  { name: 'displayName' },
  { name: 'gstNumber' },
  { name: 'drugLicenseNumber' },
  { name: 'email' },
  { name: 'phoneNumber' },
  { name: 'addressLine1' },
  { name: 'addressLine2' },
  { name: 'city' },
  { name: 'state' },
  { name: 'country' },
  { name: 'pinCode' },
  { name: 'managerName' },
  { name: 'openingDate', dataType: 'bigint' },
  { name: 'isHeadOffice', dataType: 'boolean' },
  { name: 'isActive', dataType: 'boolean' },
];

@Injectable()
export class BranchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: BranchListQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.BranchWhereInput = {
      companyId: scope.companyId,
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.isHeadOffice !== undefined
        ? { isHeadOffice: query.isHeadOffice }
        : {}),
      ...(search
        ? {
            OR: [
              { branchCode: { contains: search } },
              { branchName: { contains: search } },
              { displayName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.branch.count({ where }),
      this.prisma.client.branch.findMany({
        where,
        orderBy: { branchCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toBranchResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const branch = await this.prisma.client.branch.findFirst({
      where: { id, companyId: scope.companyId, deletedAt: null },
    });

    if (!branch) {
      throwNotFound(ErrorCode.BRANCH_NOT_FOUND, `Branch not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toBranchResponse(branch);
  }

  async create(dto: CreateBranchDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      await assertCompanyExists(tx, scope.companyId);
      await this.assertBranchCodeUnique(tx, scope.companyId, dto.branchCode);

      if (dto.isHeadOffice) {
        await clearOtherHeadOffices(tx, scope.companyId);
      }

      const now = BigInt(Date.now());
      const branch = await tx.branch.create({
        data: {
          uuid: randomUUID(),
          companyId: scope.companyId,
          branchCode: dto.branchCode,
          branchName: dto.branchName,
          displayName: dto.displayName,
          gstNumber: dto.gstNumber ?? null,
          drugLicenseNumber: dto.drugLicenseNumber ?? null,
          email: dto.email ?? null,
          phoneNumber: dto.phoneNumber ?? null,
          addressLine1: dto.addressLine1 ?? null,
          addressLine2: dto.addressLine2 ?? null,
          city: dto.city ?? null,
          state: dto.state ?? null,
          country: dto.country ?? null,
          pinCode: dto.pinCode ?? null,
          managerName: dto.managerName ?? null,
          openingDate: dto.openingDate ?? null,
          isHeadOffice: dto.isHeadOffice ?? false,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        branch,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toBranchResponse(branch);
    });
  }

  async update(id: bigint, dto: UpdateBranchDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.branch.findFirst({
        where: { id, companyId: scope.companyId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.BRANCH_NOT_FOUND, `Branch not found: ${id}`, {
          id: id.toString(),
        });
      }

      if (dto.branchCode && dto.branchCode !== existing.branchCode) {
        await this.assertBranchCodeUnique(
          tx,
          scope.companyId,
          dto.branchCode,
          id,
        );
      }

      if (dto.isHeadOffice) {
        await clearOtherHeadOffices(tx, scope.companyId, id);
      }

      const updateResult = await tx.branch.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          branchCode: dto.branchCode,
          branchName: dto.branchName,
          displayName: dto.displayName,
          gstNumber: dto.gstNumber,
          drugLicenseNumber: dto.drugLicenseNumber,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          city: dto.city,
          state: dto.state,
          country: dto.country,
          pinCode: dto.pinCode,
          managerName: dto.managerName,
          openingDate: dto.openingDate,
          isHeadOffice: dto.isHeadOffice,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Branch version conflict or not found: ${id}`,
      );

      const branch = await tx.branch.findFirstOrThrow({ where: { id } });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.BRANCH,
          entityId: branch.id,
          entityUuid: branch.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.CONFIGURATION,
        },
        existing as unknown as Record<string, unknown>,
        branch as unknown as Record<string, unknown>,
        BRANCH_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.BRANCH,
        entityUuid: branch.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: branch.uuid, branchCode: branch.branchCode },
      });
      return toBranchResponse(branch);
    });
  }

  async delete(id: bigint, version: bigint) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.branch.findFirst({
        where: { id, companyId: scope.companyId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.BRANCH_NOT_FOUND, `Branch not found: ${id}`, {
          id: id.toString(),
        });
      }

      if (existing.isHeadOffice) {
        throwConflict(
          ErrorCode.BRANCH_IN_USE,
          `Cannot delete the head office branch: ${id}`,
          { id: id.toString() },
        );
      }

      await assertBranchNotInUse(tx, id);

      const updateResult = await tx.branch.updateMany({
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
        `Branch version conflict or not found: ${id}`,
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

  private async assertBranchCodeUnique(
    tx: TxClient,
    companyId: bigint,
    branchCode: string,
    excludeId?: bigint,
  ): Promise<void> {
    const existing = await tx.branch.findFirst({
      where: {
        companyId,
        branchCode,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throwConflict(
        ErrorCode.BRANCH_CONFLICT,
        `Branch code already exists: ${branchCode}`,
        { branchCode },
      );
    }
  }

  private async emitChange(
    tx: TxClient,
    branch: Branch,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.BRANCH,
      entityId: branch.id,
      entityUuid: branch.uuid,
      action,
      module: AuditModule.CONFIGURATION,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.BRANCH,
      entityUuid: branch.uuid,
      operation,
      payload: { uuid: branch.uuid, branchCode: branch.branchCode },
    });
  }
}
