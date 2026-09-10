import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { BarcodeConfiguration, Prisma } from '@prisma/client';
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
import {
  assertBranchInCompany,
  assertJwtBranchOrCompanyWide,
  buildCompanyBranchFilter,
} from '../../persistence/context/branch-scope.util';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { CreateBarcodeConfigurationDto } from '../dto/create-barcode-configuration.dto';
import { BarcodeConfigurationListQueryDto } from '../dto/barcode-configuration-list-query.dto';
import { UpdateBarcodeConfigurationDto } from '../dto/update-barcode-configuration.dto';
import { toBarcodeConfigurationResponse } from '../mappers/barcode-configuration.mapper';
import {
  clearOtherBarcodeDefaults,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/configuration.util';

const BARCODE_CONFIGURATION_AUDIT_FIELDS = [
  { name: 'branchId', dataType: 'bigint' },
  { name: 'configurationName' },
  { name: 'barcodeType' },
  { name: 'appliesTo' },
  { name: 'labelWidth', dataType: 'decimal' },
  { name: 'labelHeight', dataType: 'decimal' },
  { name: 'dpi', dataType: 'number' },
  { name: 'showHumanReadableText', dataType: 'boolean' },
  { name: 'template' },
  { name: 'isDefault', dataType: 'boolean' },
  { name: 'isActive', dataType: 'boolean' },
  { name: 'remarks' },
];

@Injectable()
export class BarcodeConfigurationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: BarcodeConfigurationListQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.BarcodeConfigurationWhereInput = {
      companyId: scope.companyId,
      deletedAt: null,
      ...buildCompanyBranchFilter(scope.branchId),
      ...(query.barcodeType ? { barcodeType: query.barcodeType } : {}),
      ...(query.appliesTo ? { appliesTo: query.appliesTo } : {}),
      ...(query.branchId !== undefined
        ? { branchId: query.branchId ?? null }
        : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.isDefault !== undefined ? { isDefault: query.isDefault } : {}),
      ...(search
        ? {
            OR: [
              { configurationName: { contains: search } },
              { barcodeType: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.barcodeConfiguration.count({ where }),
      this.prisma.client.barcodeConfiguration.findMany({
        where,
        orderBy: { configurationName: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toBarcodeConfigurationResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const barcodeConfiguration =
      await this.prisma.client.barcodeConfiguration.findFirst({
        where: {
          id,
          companyId: scope.companyId,
          deletedAt: null,
          ...buildCompanyBranchFilter(scope.branchId),
        },
      });

    if (!barcodeConfiguration) {
      throwNotFound(
        ErrorCode.BARCODE_CONFIGURATION_NOT_FOUND,
        `Barcode configuration not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toBarcodeConfigurationResponse(barcodeConfiguration);
  }

  async create(dto: CreateBarcodeConfigurationDto) {
    const scope = getTenantScope(this.requestContext);
    assertJwtBranchOrCompanyWide(
      dto.branchId,
      scope.branchId,
      'Barcode configuration',
    );

    return this.unitOfWork.run(async (tx) => {
      const branchId = dto.branchId ?? null;
      if (branchId != null) {
        await assertBranchInCompany(tx, scope.companyId, branchId);
      }

      await this.assertConfigurationNameUnique(
        tx,
        scope.companyId,
        branchId,
        dto.configurationName,
      );

      if (dto.isDefault) {
        await clearOtherBarcodeDefaults(
          tx,
          scope.companyId,
          branchId,
          dto.configurationName,
        );
      }

      const now = BigInt(Date.now());
      const barcodeConfiguration = await tx.barcodeConfiguration.create({
        data: {
          uuid: randomUUID(),
          companyId: scope.companyId,
          branchId,
          configurationName: dto.configurationName,
          barcodeType: dto.barcodeType,
          appliesTo: dto.appliesTo,
          labelWidth: dto.labelWidth,
          labelHeight: dto.labelHeight,
          dpi: dto.dpi ?? 203,
          showHumanReadableText: dto.showHumanReadableText ?? true,
          template: dto.template ?? null,
          isDefault: dto.isDefault ?? false,
          isActive: dto.isActive ?? true,
          remarks: dto.remarks ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        barcodeConfiguration,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toBarcodeConfigurationResponse(barcodeConfiguration);
    });
  }

  async update(id: bigint, dto: UpdateBarcodeConfigurationDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.barcodeConfiguration.findFirst({
        where: {
          id,
          companyId: scope.companyId,
          deletedAt: null,
          ...buildCompanyBranchFilter(scope.branchId),
        },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.BARCODE_CONFIGURATION_NOT_FOUND,
          `Barcode configuration not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (dto.branchId !== undefined) {
        assertJwtBranchOrCompanyWide(
          dto.branchId,
          scope.branchId,
          'Barcode configuration',
        );
      }

      const branchId =
        dto.branchId !== undefined ? (dto.branchId ?? null) : existing.branchId;
      const configurationName =
        dto.configurationName ?? existing.configurationName;

      if (
        dto.configurationName &&
        dto.configurationName !== existing.configurationName
      ) {
        await this.assertConfigurationNameUnique(
          tx,
          scope.companyId,
          branchId,
          dto.configurationName,
          id,
        );
      }

      if (dto.branchId != null) {
        await assertBranchInCompany(tx, scope.companyId, dto.branchId);
      }

      if (dto.isDefault) {
        await clearOtherBarcodeDefaults(
          tx,
          scope.companyId,
          branchId,
          configurationName,
          id,
        );
      }

      const updateResult = await tx.barcodeConfiguration.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          branchId:
            dto.branchId !== undefined ? (dto.branchId ?? null) : undefined,
          configurationName: dto.configurationName,
          barcodeType: dto.barcodeType,
          appliesTo: dto.appliesTo,
          labelWidth: dto.labelWidth,
          labelHeight: dto.labelHeight,
          dpi: dto.dpi,
          showHumanReadableText: dto.showHumanReadableText,
          template: dto.template,
          isDefault: dto.isDefault,
          isActive: dto.isActive,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Barcode configuration version conflict or not found: ${id}`,
      );

      const barcodeConfiguration =
        await tx.barcodeConfiguration.findFirstOrThrow({ where: { id } });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.BARCODE_CONFIGURATION,
          entityId: barcodeConfiguration.id,
          entityUuid: barcodeConfiguration.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.CONFIGURATION,
        },
        existing as unknown as Record<string, unknown>,
        barcodeConfiguration as unknown as Record<string, unknown>,
        BARCODE_CONFIGURATION_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.BARCODE_CONFIGURATION,
        entityUuid: barcodeConfiguration.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: barcodeConfiguration.uuid,
          configurationName: barcodeConfiguration.configurationName,
        },
      });
      return toBarcodeConfigurationResponse(barcodeConfiguration);
    });
  }

  async delete(id: bigint, version: number) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.barcodeConfiguration.findFirst({
        where: {
          id,
          companyId: scope.companyId,
          deletedAt: null,
          ...buildCompanyBranchFilter(scope.branchId),
        },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.BARCODE_CONFIGURATION_NOT_FOUND,
          `Barcode configuration not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.barcodeConfiguration.updateMany({
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
        `Barcode configuration version conflict or not found: ${id}`,
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

  private async assertConfigurationNameUnique(
    tx: TxClient,
    companyId: bigint,
    branchId: bigint | null,
    configurationName: string,
    excludeId?: bigint,
  ): Promise<void> {
    const existing = await tx.barcodeConfiguration.findFirst({
      where: {
        companyId,
        branchId,
        configurationName,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throwConflict(
        ErrorCode.BARCODE_CONFIGURATION_CONFLICT,
        `Configuration name already exists: ${configurationName}`,
        { configurationName },
      );
    }
  }

  private async emitChange(
    tx: TxClient,
    barcodeConfiguration: BarcodeConfiguration,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.BARCODE_CONFIGURATION,
      entityId: barcodeConfiguration.id,
      entityUuid: barcodeConfiguration.uuid,
      action,
      module: AuditModule.CONFIGURATION,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.BARCODE_CONFIGURATION,
      entityUuid: barcodeConfiguration.uuid,
      operation,
      payload: {
        uuid: barcodeConfiguration.uuid,
        configurationName: barcodeConfiguration.configurationName,
      },
    });
  }
}
