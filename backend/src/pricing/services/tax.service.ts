import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma, Tax } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { auditAndLogChanges } from '../../audit/utils/audit.util';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { CreateTaxDto } from '../dto/create-tax.dto';
import { TaxListQueryDto } from '../dto/tax-list-query.dto';
import { UpdateTaxDto } from '../dto/update-tax.dto';
import { toTaxResponse } from '../mappers/tax.mapper';
import {
  assertTaxNotInUse,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/pricing.util';

const TAX_AUDIT_FIELDS = [
  { name: 'taxCode' },
  { name: 'taxName' },
  { name: 'taxType' },
  { name: 'taxRate', dataType: 'decimal' },
  { name: 'effectiveFrom', dataType: 'bigint' },
  { name: 'effectiveTo', dataType: 'bigint' },
  { name: 'isActive', dataType: 'boolean' },
  { name: 'description' },
];

@Injectable()
export class TaxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: TaxListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.TaxWhereInput = {
      deletedAt: null,
      ...(query.taxType ? { taxType: query.taxType } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(search
        ? {
            OR: [
              { taxCode: { contains: search } },
              { taxName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.tax.count({ where }),
      this.prisma.client.tax.findMany({
        where,
        orderBy: { taxCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toTaxResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const tax = await this.prisma.client.tax.findFirst({
      where: { id, deletedAt: null },
    });

    if (!tax) {
      throwNotFound(ErrorCode.TAX_NOT_FOUND, `Tax not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toTaxResponse(tax);
  }

  async create(dto: CreateTaxDto) {
    return this.unitOfWork.run(async (tx) => {
      await this.assertTaxCodeUnique(tx, dto.taxCode);

      const now = BigInt(Date.now());
      const tax = await tx.tax.create({
        data: {
          uuid: randomUUID(),
          taxCode: dto.taxCode,
          taxName: dto.taxName,
          taxType: dto.taxType,
          taxRate: dto.taxRate,
          effectiveFrom: dto.effectiveFrom,
          effectiveTo: dto.effectiveTo ?? null,
          isActive: dto.isActive ?? true,
          description: dto.description ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        tax,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toTaxResponse(tax);
    });
  }

  async update(id: bigint, dto: UpdateTaxDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.tax.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.TAX_NOT_FOUND, `Tax not found: ${id}`, {
          id: id.toString(),
        });
      }

      if (dto.taxCode && dto.taxCode !== existing.taxCode) {
        await this.assertTaxCodeUnique(tx, dto.taxCode, id);
      }

      const updateResult = await tx.tax.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          taxCode: dto.taxCode,
          taxName: dto.taxName,
          taxType: dto.taxType,
          taxRate: dto.taxRate,
          effectiveFrom: dto.effectiveFrom,
          effectiveTo: dto.effectiveTo,
          isActive: dto.isActive,
          description: dto.description,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Tax version conflict or not found: ${id}`,
      );

      const tax = await tx.tax.findFirstOrThrow({ where: { id } });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.TAX,
          entityId: tax.id,
          entityUuid: tax.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.PRICING,
        },
        existing as unknown as Record<string, unknown>,
        tax as unknown as Record<string, unknown>,
        TAX_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.TAX,
        entityUuid: tax.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: tax.uuid, taxCode: tax.taxCode },
      });
      return toTaxResponse(tax);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.tax.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.TAX_NOT_FOUND, `Tax not found: ${id}`, {
          id: id.toString(),
        });
      }

      await assertTaxNotInUse(tx, id);

      const updateResult = await tx.tax.updateMany({
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
        `Tax version conflict or not found: ${id}`,
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

  private async assertTaxCodeUnique(
    tx: TxClient,
    taxCode: string,
    excludeId?: bigint,
  ): Promise<void> {
    const existing = await tx.tax.findFirst({
      where: {
        taxCode,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throwConflict(ErrorCode.CONFLICT, `Tax code already exists: ${taxCode}`, {
        taxCode,
      });
    }
  }

  private async emitChange(
    tx: TxClient,
    tax: Tax,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.TAX,
      entityId: tax.id,
      entityUuid: tax.uuid,
      action,
      module: AuditModule.PRICING,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.TAX,
      entityUuid: tax.uuid,
      operation,
      payload: { uuid: tax.uuid, taxCode: tax.taxCode },
    });
  }
}
