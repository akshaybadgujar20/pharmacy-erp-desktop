import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Company, Prisma } from '@prisma/client';
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
import { CreateCompanyDto } from '../dto/create-company.dto';
import { CompanyListQueryDto } from '../dto/company-list-query.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { toCompanyResponse } from '../mappers/company.mapper';
import {
  assertCompanyNotInUse,
  clearOtherCompanyDefaults,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/configuration.util';

const COMPANY_AUDIT_FIELDS = [
  { name: 'companyCode' },
  { name: 'companyName' },
  { name: 'displayName' },
  { name: 'gstNumber' },
  { name: 'panNumber' },
  { name: 'drugLicenseNumber' },
  { name: 'email' },
  { name: 'phoneNumber' },
  { name: 'website' },
  { name: 'logoPath' },
  { name: 'addressLine1' },
  { name: 'addressLine2' },
  { name: 'city' },
  { name: 'state' },
  { name: 'country' },
  { name: 'pinCode' },
  { name: 'isDefault', dataType: 'boolean' },
  { name: 'isActive', dataType: 'boolean' },
];

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: CompanyListQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.CompanyWhereInput = {
      id: scope.companyId,
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.isDefault !== undefined ? { isDefault: query.isDefault } : {}),
      ...(search
        ? {
            OR: [
              { companyCode: { contains: search } },
              { companyName: { contains: search } },
              { displayName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.company.count({ where }),
      this.prisma.client.company.findMany({
        where,
        orderBy: { companyCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toCompanyResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    if (id !== scope.companyId) {
      throwNotFound(ErrorCode.COMPANY_NOT_FOUND, `Company not found: ${id}`, {
        id: id.toString(),
      });
    }
    const company = await this.prisma.client.company.findFirst({
      where: { id: scope.companyId, deletedAt: null },
    });

    if (!company) {
      throwNotFound(ErrorCode.COMPANY_NOT_FOUND, `Company not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toCompanyResponse(company);
  }

  async create(dto: CreateCompanyDto) {
    return this.unitOfWork.run(async (tx) => {
      await this.assertUniqueFields(tx, dto);

      if (dto.isDefault) {
        await clearOtherCompanyDefaults(tx);
      }

      const now = BigInt(Date.now());
      const company = await tx.company.create({
        data: {
          uuid: randomUUID(),
          companyCode: dto.companyCode,
          companyName: dto.companyName,
          displayName: dto.displayName,
          gstNumber: dto.gstNumber ?? null,
          panNumber: dto.panNumber ?? null,
          drugLicenseNumber: dto.drugLicenseNumber ?? null,
          email: dto.email ?? null,
          phoneNumber: dto.phoneNumber ?? null,
          website: dto.website ?? null,
          logoPath: dto.logoPath ?? null,
          addressLine1: dto.addressLine1 ?? null,
          addressLine2: dto.addressLine2 ?? null,
          city: dto.city ?? null,
          state: dto.state ?? null,
          country: dto.country ?? null,
          pinCode: dto.pinCode ?? null,
          isDefault: dto.isDefault ?? false,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        company,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toCompanyResponse(company);
    });
  }

  async update(id: bigint, dto: UpdateCompanyDto) {
    const scope = getTenantScope(this.requestContext);
    if (id !== scope.companyId) {
      throwNotFound(ErrorCode.COMPANY_NOT_FOUND, `Company not found: ${id}`, {
        id: id.toString(),
      });
    }

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.company.findFirst({
        where: { id: scope.companyId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.COMPANY_NOT_FOUND, `Company not found: ${id}`, {
          id: id.toString(),
        });
      }

      await this.assertUniqueFields(tx, dto, id);

      if (dto.isDefault) {
        await clearOtherCompanyDefaults(tx, id);
      }

      const updateResult = await tx.company.updateMany({
        where: { id: scope.companyId, version: dto.version, deletedAt: null },
        data: {
          companyCode: dto.companyCode,
          companyName: dto.companyName,
          displayName: dto.displayName,
          gstNumber: dto.gstNumber,
          panNumber: dto.panNumber,
          drugLicenseNumber: dto.drugLicenseNumber,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          website: dto.website,
          logoPath: dto.logoPath,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          city: dto.city,
          state: dto.state,
          country: dto.country,
          pinCode: dto.pinCode,
          isDefault: dto.isDefault,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Company version conflict or not found: ${id}`,
      );

      const company = await tx.company.findFirstOrThrow({
        where: { id: scope.companyId },
      });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.COMPANY,
          entityId: company.id,
          entityUuid: company.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.CONFIGURATION,
        },
        existing as unknown as Record<string, unknown>,
        company as unknown as Record<string, unknown>,
        COMPANY_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.COMPANY,
        entityUuid: company.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: company.uuid, companyCode: company.companyCode },
      });
      return toCompanyResponse(company);
    });
  }

  async delete(id: bigint, version: number) {
    const scope = getTenantScope(this.requestContext);
    if (id !== scope.companyId) {
      throwNotFound(ErrorCode.COMPANY_NOT_FOUND, `Company not found: ${id}`, {
        id: id.toString(),
      });
    }

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.company.findFirst({
        where: { id: scope.companyId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.COMPANY_NOT_FOUND, `Company not found: ${id}`, {
          id: id.toString(),
        });
      }

      if (existing.isDefault) {
        throwConflict(
          ErrorCode.COMPANY_IN_USE,
          `Cannot delete the default company: ${id}`,
          { id: id.toString() },
        );
      }

      await assertCompanyNotInUse(tx, scope.companyId);

      const updateResult = await tx.company.updateMany({
        where: { id: scope.companyId, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Company version conflict or not found: ${id}`,
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

  private async assertUniqueFields(
    tx: TxClient,
    dto: CreateCompanyDto | UpdateCompanyDto,
    excludeId?: bigint,
  ): Promise<void> {
    if (dto.companyCode) {
      const existing = await tx.company.findFirst({
        where: {
          companyCode: dto.companyCode,
          deletedAt: null,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      });

      if (existing) {
        throwConflict(
          ErrorCode.COMPANY_CONFLICT,
          `Company code already exists: ${dto.companyCode}`,
          { companyCode: dto.companyCode },
        );
      }
    }

    if (dto.companyName) {
      const existing = await tx.company.findFirst({
        where: {
          companyName: dto.companyName,
          deletedAt: null,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      });

      if (existing) {
        throwConflict(
          ErrorCode.COMPANY_CONFLICT,
          `Company name already exists: ${dto.companyName}`,
          { companyName: dto.companyName },
        );
      }
    }

    if (dto.gstNumber) {
      const existing = await tx.company.findFirst({
        where: {
          gstNumber: dto.gstNumber,
          deletedAt: null,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      });

      if (existing) {
        throwConflict(
          ErrorCode.COMPANY_CONFLICT,
          `GST number already exists: ${dto.gstNumber}`,
          { gstNumber: dto.gstNumber },
        );
      }
    }

    if (dto.drugLicenseNumber) {
      const existing = await tx.company.findFirst({
        where: {
          drugLicenseNumber: dto.drugLicenseNumber,
          deletedAt: null,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      });

      if (existing) {
        throwConflict(
          ErrorCode.COMPANY_CONFLICT,
          `Drug license number already exists: ${dto.drugLicenseNumber}`,
          { drugLicenseNumber: dto.drugLicenseNumber },
        );
      }
    }
  }

  private async emitChange(
    tx: TxClient,
    company: Company,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.COMPANY,
      entityId: company.id,
      entityUuid: company.uuid,
      action,
      module: AuditModule.CONFIGURATION,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.COMPANY,
      entityUuid: company.uuid,
      operation,
      payload: { uuid: company.uuid, companyCode: company.companyCode },
    });
  }
}
