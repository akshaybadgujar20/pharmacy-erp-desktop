import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PrinterConfiguration, Prisma } from '@prisma/client';
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
import { PrintOrientation } from '../constants/configuration.constants';
import { CreatePrinterConfigurationDto } from '../dto/create-printer-configuration.dto';
import { PrinterConfigurationListQueryDto } from '../dto/printer-configuration-list-query.dto';
import { UpdatePrinterConfigurationDto } from '../dto/update-printer-configuration.dto';
import { toPrinterConfigurationResponse } from '../mappers/printer-configuration.mapper';
import {
  clearOtherPrinterDefaults,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/configuration.util';

const PRINTER_CONFIGURATION_AUDIT_FIELDS = [
  { name: 'branchId', dataType: 'bigint' },
  { name: 'printerName' },
  { name: 'printerType' },
  { name: 'documentType' },
  { name: 'printerPath' },
  { name: 'paperSize' },
  { name: 'copies', dataType: 'number' },
  { name: 'printOrientation' },
  { name: 'isDefault', dataType: 'boolean' },
  { name: 'isActive', dataType: 'boolean' },
  { name: 'remarks' },
];

@Injectable()
export class PrinterConfigurationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: PrinterConfigurationListQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.PrinterConfigurationWhereInput = {
      companyId: scope.companyId,
      deletedAt: null,
      ...buildCompanyBranchFilter(scope.branchId),
      ...(query.documentType ? { documentType: query.documentType } : {}),
      ...(query.branchId !== undefined
        ? { branchId: query.branchId ?? null }
        : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.isDefault !== undefined ? { isDefault: query.isDefault } : {}),
      ...(search
        ? {
            OR: [
              { printerName: { contains: search } },
              { documentType: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.printerConfiguration.count({ where }),
      this.prisma.client.printerConfiguration.findMany({
        where,
        orderBy: [{ documentType: 'asc' }, { printerName: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPrinterConfigurationResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const printerConfiguration =
      await this.prisma.client.printerConfiguration.findFirst({
        where: {
          id,
          companyId: scope.companyId,
          deletedAt: null,
          ...buildCompanyBranchFilter(scope.branchId),
        },
      });

    if (!printerConfiguration) {
      throwNotFound(
        ErrorCode.PRINTER_CONFIGURATION_NOT_FOUND,
        `Printer configuration not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toPrinterConfigurationResponse(printerConfiguration);
  }

  async create(dto: CreatePrinterConfigurationDto) {
    const scope = getTenantScope(this.requestContext);
    assertJwtBranchOrCompanyWide(
      dto.branchId,
      scope.branchId,
      'Printer configuration',
    );

    return this.unitOfWork.run(async (tx) => {
      const branchId = dto.branchId ?? null;
      if (branchId != null) {
        await assertBranchInCompany(tx, scope.companyId, branchId);
      }

      await this.assertPrinterNameUnique(
        tx,
        scope.companyId,
        branchId,
        dto.printerName,
      );

      if (dto.isDefault) {
        await clearOtherPrinterDefaults(
          tx,
          scope.companyId,
          branchId,
          dto.documentType,
        );
      }

      const now = BigInt(Date.now());
      const printerConfiguration = await tx.printerConfiguration.create({
        data: {
          uuid: randomUUID(),
          companyId: scope.companyId,
          branchId,
          printerName: dto.printerName,
          printerType: dto.printerType,
          documentType: dto.documentType,
          printerPath: dto.printerPath ?? null,
          paperSize: dto.paperSize ?? null,
          copies: dto.copies ?? 1,
          printOrientation: dto.printOrientation ?? PrintOrientation.PORTRAIT,
          isDefault: dto.isDefault ?? false,
          isActive: dto.isActive ?? true,
          remarks: dto.remarks ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        printerConfiguration,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toPrinterConfigurationResponse(printerConfiguration);
    });
  }

  async update(id: bigint, dto: UpdatePrinterConfigurationDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.printerConfiguration.findFirst({
        where: {
          id,
          companyId: scope.companyId,
          deletedAt: null,
          ...buildCompanyBranchFilter(scope.branchId),
        },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PRINTER_CONFIGURATION_NOT_FOUND,
          `Printer configuration not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (dto.branchId !== undefined) {
        assertJwtBranchOrCompanyWide(
          dto.branchId,
          scope.branchId,
          'Printer configuration',
        );
      }

      const branchId =
        dto.branchId !== undefined ? (dto.branchId ?? null) : existing.branchId;
      const documentType = dto.documentType ?? existing.documentType;

      if (dto.printerName && dto.printerName !== existing.printerName) {
        await this.assertPrinterNameUnique(
          tx,
          scope.companyId,
          branchId,
          dto.printerName,
          id,
        );
      }

      if (dto.branchId != null) {
        await assertBranchInCompany(tx, scope.companyId, dto.branchId);
      }

      if (dto.isDefault) {
        await clearOtherPrinterDefaults(
          tx,
          scope.companyId,
          branchId,
          documentType,
          id,
        );
      }

      const updateResult = await tx.printerConfiguration.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          branchId:
            dto.branchId !== undefined ? (dto.branchId ?? null) : undefined,
          printerName: dto.printerName,
          printerType: dto.printerType,
          documentType: dto.documentType,
          printerPath: dto.printerPath,
          paperSize: dto.paperSize,
          copies: dto.copies,
          printOrientation: dto.printOrientation,
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
        `Printer configuration version conflict or not found: ${id}`,
      );

      const printerConfiguration =
        await tx.printerConfiguration.findFirstOrThrow({ where: { id } });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.PRINTER_CONFIGURATION,
          entityId: printerConfiguration.id,
          entityUuid: printerConfiguration.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.CONFIGURATION,
        },
        existing as unknown as Record<string, unknown>,
        printerConfiguration as unknown as Record<string, unknown>,
        PRINTER_CONFIGURATION_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PRINTER_CONFIGURATION,
        entityUuid: printerConfiguration.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: printerConfiguration.uuid,
          printerName: printerConfiguration.printerName,
        },
      });
      return toPrinterConfigurationResponse(printerConfiguration);
    });
  }

  async delete(id: bigint, version: bigint) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.printerConfiguration.findFirst({
        where: {
          id,
          companyId: scope.companyId,
          deletedAt: null,
          ...buildCompanyBranchFilter(scope.branchId),
        },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PRINTER_CONFIGURATION_NOT_FOUND,
          `Printer configuration not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.printerConfiguration.updateMany({
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
        `Printer configuration version conflict or not found: ${id}`,
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

  private async assertPrinterNameUnique(
    tx: TxClient,
    companyId: bigint,
    branchId: bigint | null,
    printerName: string,
    excludeId?: bigint,
  ): Promise<void> {
    const existing = await tx.printerConfiguration.findFirst({
      where: {
        companyId,
        branchId,
        printerName,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throwConflict(
        ErrorCode.PRINTER_CONFIGURATION_CONFLICT,
        `Printer name already exists: ${printerName}`,
        { printerName },
      );
    }
  }

  private async emitChange(
    tx: TxClient,
    printerConfiguration: PrinterConfiguration,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.PRINTER_CONFIGURATION,
      entityId: printerConfiguration.id,
      entityUuid: printerConfiguration.uuid,
      action,
      module: AuditModule.CONFIGURATION,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.PRINTER_CONFIGURATION,
      entityUuid: printerConfiguration.uuid,
      operation,
      payload: {
        uuid: printerConfiguration.uuid,
        printerName: printerConfiguration.printerName,
      },
    });
  }
}
