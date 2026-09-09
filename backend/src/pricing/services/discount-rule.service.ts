import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { DiscountRule, Prisma } from '@prisma/client';
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
import { CreateDiscountRuleDto } from '../dto/create-discount-rule.dto';
import { DiscountRuleListQueryDto } from '../dto/discount-rule-list-query.dto';
import { UpdateDiscountRuleDto } from '../dto/update-discount-rule.dto';
import { toDiscountRuleResponse } from '../mappers/discount-rule.mapper';
import {
  assertCategoryExists,
  assertCustomerExists,
  assertMedicineExists,
  assertPriceListExists,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/pricing.util';

const DISCOUNT_RULE_AUDIT_FIELDS = [
  { name: 'ruleCode' },
  { name: 'ruleName' },
  { name: 'discountType' },
  { name: 'discountValue', dataType: 'decimal' },
  { name: 'appliesTo' },
  { name: 'medicineId', dataType: 'bigint' },
  { name: 'categoryId', dataType: 'bigint' },
  { name: 'customerId', dataType: 'bigint' },
  { name: 'priceListId', dataType: 'bigint' },
  { name: 'minimumQuantity', dataType: 'decimal' },
  { name: 'minimumAmount', dataType: 'decimal' },
  { name: 'priority', dataType: 'number' },
  { name: 'effectiveFrom', dataType: 'bigint' },
  { name: 'effectiveTo', dataType: 'bigint' },
  { name: 'isActive', dataType: 'boolean' },
  { name: 'remarks' },
];

@Injectable()
export class DiscountRuleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: DiscountRuleListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.DiscountRuleWhereInput = {
      deletedAt: null,
      ...(query.appliesTo ? { appliesTo: query.appliesTo } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(search
        ? {
            OR: [
              { ruleCode: { contains: search } },
              { ruleName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.discountRule.count({ where }),
      this.prisma.client.discountRule.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { ruleCode: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toDiscountRuleResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const rule = await this.prisma.client.discountRule.findFirst({
      where: { id, deletedAt: null },
    });

    if (!rule) {
      throwNotFound(
        ErrorCode.DISCOUNT_RULE_NOT_FOUND,
        `Discount rule not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toDiscountRuleResponse(rule);
  }

  async create(dto: CreateDiscountRuleDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      await this.assertRuleCodeUnique(tx, dto.ruleCode);
      await this.validateForeignKeys(tx, dto, scope.branchId);

      const now = BigInt(Date.now());
      const rule = await tx.discountRule.create({
        data: {
          uuid: randomUUID(),
          ruleCode: dto.ruleCode,
          ruleName: dto.ruleName,
          discountType: dto.discountType,
          discountValue: dto.discountValue,
          appliesTo: dto.appliesTo,
          medicineId: dto.medicineId ?? null,
          categoryId: dto.categoryId ?? null,
          customerId: dto.customerId ?? null,
          priceListId: dto.priceListId ?? null,
          minimumQuantity: dto.minimumQuantity ?? null,
          minimumAmount: dto.minimumAmount ?? null,
          priority: dto.priority,
          effectiveFrom: dto.effectiveFrom,
          effectiveTo: dto.effectiveTo ?? null,
          isActive: dto.isActive ?? true,
          remarks: dto.remarks ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        rule,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toDiscountRuleResponse(rule);
    });
  }

  async update(id: bigint, dto: UpdateDiscountRuleDto) {
    const scope = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.discountRule.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.DISCOUNT_RULE_NOT_FOUND,
          `Discount rule not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (dto.ruleCode && dto.ruleCode !== existing.ruleCode) {
        await this.assertRuleCodeUnique(tx, dto.ruleCode, id);
      }

      await this.validateForeignKeys(tx, dto, scope.branchId);

      const updateResult = await tx.discountRule.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          ruleCode: dto.ruleCode,
          ruleName: dto.ruleName,
          discountType: dto.discountType,
          discountValue: dto.discountValue,
          appliesTo: dto.appliesTo,
          medicineId: dto.medicineId,
          categoryId: dto.categoryId,
          customerId: dto.customerId,
          priceListId: dto.priceListId,
          minimumQuantity: dto.minimumQuantity,
          minimumAmount: dto.minimumAmount,
          priority: dto.priority,
          effectiveFrom: dto.effectiveFrom,
          effectiveTo: dto.effectiveTo,
          isActive: dto.isActive,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Discount rule version conflict or not found: ${id}`,
      );

      const rule = await tx.discountRule.findFirstOrThrow({ where: { id } });
      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.DISCOUNT_RULE,
          entityId: rule.id,
          entityUuid: rule.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.PRICING,
        },
        existing as unknown as Record<string, unknown>,
        rule as unknown as Record<string, unknown>,
        DISCOUNT_RULE_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.DISCOUNT_RULE,
        entityUuid: rule.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: rule.uuid, ruleCode: rule.ruleCode },
      });
      return toDiscountRuleResponse(rule);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.discountRule.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.DISCOUNT_RULE_NOT_FOUND,
          `Discount rule not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.discountRule.updateMany({
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
        `Discount rule version conflict or not found: ${id}`,
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

  private async validateForeignKeys(
    tx: TxClient,
    dto: CreateDiscountRuleDto | UpdateDiscountRuleDto,
    branchId: bigint,
  ): Promise<void> {
    if (dto.medicineId) {
      await assertMedicineExists(tx, dto.medicineId);
    }
    if (dto.categoryId) {
      await assertCategoryExists(tx, dto.categoryId);
    }
    if (dto.customerId) {
      await assertCustomerExists(tx, dto.customerId);
    }
    if (dto.priceListId) {
      await assertPriceListExists(tx, dto.priceListId, branchId, false);
    }
  }

  private async assertRuleCodeUnique(
    tx: TxClient,
    ruleCode: string,
    excludeId?: bigint,
  ): Promise<void> {
    const existing = await tx.discountRule.findFirst({
      where: {
        ruleCode,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throwConflict(
        ErrorCode.CONFLICT,
        `Discount rule code already exists: ${ruleCode}`,
        { ruleCode },
      );
    }
  }

  private async emitChange(
    tx: TxClient,
    rule: DiscountRule,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.DISCOUNT_RULE,
      entityId: rule.id,
      entityUuid: rule.uuid,
      action,
      module: AuditModule.PRICING,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.DISCOUNT_RULE,
      entityUuid: rule.uuid,
      operation,
      payload: { uuid: rule.uuid, ruleCode: rule.ruleCode },
    });
  }
}
