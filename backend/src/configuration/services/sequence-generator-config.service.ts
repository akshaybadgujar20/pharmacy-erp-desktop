import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma, SequenceGenerator } from '@prisma/client';
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
import { CreateSequenceGeneratorDto } from '../dto/create-sequence-generator.dto';
import { SequenceGeneratorListQueryDto } from '../dto/sequence-generator-list-query.dto';
import { UpdateSequenceGeneratorDto } from '../dto/update-sequence-generator.dto';
import { toSequenceGeneratorResponse } from '../mappers/sequence-generator.mapper';
import {
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/configuration.util';

const SEQUENCE_GENERATOR_AUDIT_FIELDS = [
  { name: 'branchId', dataType: 'bigint' },
  { name: 'documentType' },
  { name: 'prefix' },
  { name: 'suffix' },
  { name: 'currentNumber', dataType: 'bigint' },
  { name: 'incrementBy', dataType: 'number' },
  { name: 'paddingLength', dataType: 'number' },
  { name: 'resetPolicy' },
  { name: 'format' },
  { name: 'isActive', dataType: 'boolean' },
];

@Injectable()
export class SequenceGeneratorConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: SequenceGeneratorListQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.SequenceGeneratorWhereInput = {
      companyId: scope.companyId,
      ...buildCompanyBranchFilter(scope.branchId),
      ...(query.documentType ? { documentType: query.documentType } : {}),
      ...(query.branchId !== undefined
        ? { branchId: query.branchId ?? null }
        : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(search
        ? {
            OR: [
              { documentType: { contains: search } },
              { prefix: { contains: search } },
              { format: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.sequenceGenerator.count({ where }),
      this.prisma.client.sequenceGenerator.findMany({
        where,
        orderBy: [{ documentType: 'asc' }, { branchId: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toSequenceGeneratorResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const sequenceGenerator =
      await this.prisma.client.sequenceGenerator.findFirst({
        where: {
          id,
          companyId: scope.companyId,
          ...buildCompanyBranchFilter(scope.branchId),
        },
      });

    if (!sequenceGenerator) {
      throwNotFound(
        ErrorCode.SEQUENCE_GENERATOR_NOT_FOUND,
        `Sequence generator not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toSequenceGeneratorResponse(sequenceGenerator);
  }

  async create(dto: CreateSequenceGeneratorDto) {
    const scope = getTenantScope(this.requestContext);
    assertJwtBranchOrCompanyWide(
      dto.branchId,
      scope.branchId,
      'Sequence generator',
    );

    return this.unitOfWork.run(async (tx) => {
      const branchId = dto.branchId ?? null;
      if (branchId != null) {
        await assertBranchInCompany(tx, scope.companyId, branchId);
      }

      await this.assertUniqueDocumentType(
        tx,
        scope.companyId,
        branchId,
        dto.documentType,
      );

      const now = BigInt(Date.now());
      const sequenceGenerator = await tx.sequenceGenerator.create({
        data: {
          uuid: randomUUID(),
          companyId: scope.companyId,
          branchId,
          documentType: dto.documentType,
          prefix: dto.prefix ?? null,
          suffix: dto.suffix ?? null,
          currentNumber: dto.currentNumber,
          incrementBy: dto.incrementBy ?? 1,
          paddingLength: dto.paddingLength ?? 6,
          resetPolicy: dto.resetPolicy,
          format: dto.format ?? null,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        sequenceGenerator,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toSequenceGeneratorResponse(sequenceGenerator);
    });
  }

  async update(id: bigint, dto: UpdateSequenceGeneratorDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.sequenceGenerator.findFirst({
        where: {
          id,
          companyId: scope.companyId,
          ...buildCompanyBranchFilter(scope.branchId),
        },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.SEQUENCE_GENERATOR_NOT_FOUND,
          `Sequence generator not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (dto.branchId !== undefined) {
        assertJwtBranchOrCompanyWide(
          dto.branchId,
          scope.branchId,
          'Sequence generator',
        );
      }

      const branchId =
        dto.branchId !== undefined ? (dto.branchId ?? null) : existing.branchId;
      const documentType = dto.documentType ?? existing.documentType;

      if (
        (dto.branchId !== undefined && branchId !== existing.branchId) ||
        (dto.documentType && documentType !== existing.documentType)
      ) {
        if (dto.branchId != null) {
          await assertBranchInCompany(tx, scope.companyId, dto.branchId);
        }
        await this.assertUniqueDocumentType(
          tx,
          scope.companyId,
          branchId,
          documentType,
          id,
        );
      }

      const updateResult = await tx.sequenceGenerator.updateMany({
        where: { id, version: dto.version },
        data: {
          branchId:
            dto.branchId !== undefined ? (dto.branchId ?? null) : undefined,
          documentType: dto.documentType,
          prefix: dto.prefix,
          suffix: dto.suffix,
          currentNumber: dto.currentNumber,
          incrementBy: dto.incrementBy,
          paddingLength: dto.paddingLength,
          resetPolicy: dto.resetPolicy,
          format: dto.format,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sequence generator version conflict or not found: ${id}`,
      );

      const sequenceGenerator = await tx.sequenceGenerator.findFirstOrThrow({
        where: { id },
      });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.SEQUENCE_GENERATOR,
          entityId: sequenceGenerator.id,
          entityUuid: sequenceGenerator.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.CONFIGURATION,
        },
        existing as unknown as Record<string, unknown>,
        sequenceGenerator as unknown as Record<string, unknown>,
        SEQUENCE_GENERATOR_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.SEQUENCE_GENERATOR,
        entityUuid: sequenceGenerator.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: sequenceGenerator.uuid,
          documentType: sequenceGenerator.documentType,
        },
      });
      return toSequenceGeneratorResponse(sequenceGenerator);
    });
  }

  async delete(id: bigint, version: number) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.sequenceGenerator.findFirst({
        where: {
          id,
          companyId: scope.companyId,
          ...buildCompanyBranchFilter(scope.branchId),
        },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.SEQUENCE_GENERATOR_NOT_FOUND,
          `Sequence generator not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (existing.isActive) {
        throwConflict(
          ErrorCode.SEQUENCE_GENERATOR_CONFLICT,
          `Deactivate sequence generator before delete: ${id}`,
          { id: id.toString() },
        );
      }

      const deleteResult = await tx.sequenceGenerator.deleteMany({
        where: { id, version },
      });

      optimisticUpdate(
        deleteResult,
        id,
        `Sequence generator version conflict or not found: ${id}`,
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

  private async assertUniqueDocumentType(
    tx: TxClient,
    companyId: bigint,
    branchId: bigint | null,
    documentType: string,
    excludeId?: bigint,
  ): Promise<void> {
    const existing = await tx.sequenceGenerator.findFirst({
      where: {
        companyId,
        branchId,
        documentType,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throwConflict(
        ErrorCode.SEQUENCE_GENERATOR_CONFLICT,
        `Sequence generator already exists for document type: ${documentType}`,
        { documentType },
      );
    }
  }

  private async emitChange(
    tx: TxClient,
    sequenceGenerator: SequenceGenerator,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.SEQUENCE_GENERATOR,
      entityId: sequenceGenerator.id,
      entityUuid: sequenceGenerator.uuid,
      action,
      module: AuditModule.CONFIGURATION,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.SEQUENCE_GENERATOR,
      entityUuid: sequenceGenerator.uuid,
      operation,
      payload: {
        uuid: sequenceGenerator.uuid,
        documentType: sequenceGenerator.documentType,
      },
    });
  }
}
