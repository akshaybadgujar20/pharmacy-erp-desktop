import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { MedicineCategory, Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
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
import {
  CreateMedicineCategoryDto,
  UpdateMedicineCategoryDto,
} from '../dto/create-medicine-category.dto';
import { MedicineCategoryListQueryDto } from '../dto/medicine-category-list-query.dto';
import { toMedicineCategoryResponse } from '../mappers/medicine-category.mapper';
import {
  assertCategoryExists,
  assertCategoryNotInUse,
  assertNoCategoryCycle,
  assertUniqueActiveField,
  optimisticUpdate,
  throwNotFound,
} from '../utils/medicine.util';

@Injectable()
export class MedicineCategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: MedicineCategoryListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const parentCategoryId = query.parentCategoryId
      ? BigInt(query.parentCategoryId)
      : undefined;

    const where: Prisma.MedicineCategoryWhereInput = {
      deletedAt: null,
      ...(parentCategoryId !== undefined ? { parentCategoryId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(search
        ? {
            OR: [
              { categoryCode: { contains: search } },
              { categoryName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.medicineCategory.count({ where }),
      this.prisma.client.medicineCategory.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { categoryCode: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toMedicineCategoryResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const category = await this.prisma.client.medicineCategory.findFirst({
      where: { id, deletedAt: null },
    });

    if (!category) {
      throwNotFound(
        ErrorCode.MEDICINE_CATEGORY_NOT_FOUND,
        `Medicine category not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toMedicineCategoryResponse(category);
  }

  async create(dto: CreateMedicineCategoryDto) {
    return this.unitOfWork.run(async (tx) => {
      if (dto.parentCategoryId) {
        await assertCategoryExists(tx, dto.parentCategoryId);
      }

      await assertNoCategoryCycle(tx, null, dto.parentCategoryId ?? null);
      await assertUniqueActiveField(
        tx,
        'medicineCategory',
        'categoryCode',
        dto.categoryCode,
        'Category code',
      );
      await assertUniqueActiveField(
        tx,
        'medicineCategory',
        'categoryName',
        dto.categoryName,
        'Category name',
      );

      const now = BigInt(Date.now());
      const category = await tx.medicineCategory.create({
        data: {
          uuid: randomUUID(),
          parentCategoryId: dto.parentCategoryId ?? null,
          categoryCode: dto.categoryCode,
          categoryName: dto.categoryName,
          description: dto.description,
          displayOrder: dto.displayOrder ?? 0,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        category,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toMedicineCategoryResponse(category);
    });
  }

  async update(id: bigint, dto: UpdateMedicineCategoryDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.medicineCategory.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.MEDICINE_CATEGORY_NOT_FOUND,
          `Medicine category not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (dto.parentCategoryId !== undefined && dto.parentCategoryId != null) {
        await assertCategoryExists(tx, dto.parentCategoryId);
      }

      if (dto.parentCategoryId !== undefined) {
        await assertNoCategoryCycle(tx, id, dto.parentCategoryId);
      }

      if (dto.categoryCode && dto.categoryCode !== existing.categoryCode) {
        await assertUniqueActiveField(
          tx,
          'medicineCategory',
          'categoryCode',
          dto.categoryCode,
          'Category code',
          id,
        );
      }

      if (dto.categoryName && dto.categoryName !== existing.categoryName) {
        await assertUniqueActiveField(
          tx,
          'medicineCategory',
          'categoryName',
          dto.categoryName,
          'Category name',
          id,
        );
      }

      const updateResult = await tx.medicineCategory.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          ...(dto.parentCategoryId !== undefined
            ? { parentCategoryId: dto.parentCategoryId }
            : {}),
          categoryCode: dto.categoryCode,
          categoryName: dto.categoryName,
          description: dto.description,
          displayOrder: dto.displayOrder,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Medicine category version conflict or not found: ${id}`,
      );

      const category = await tx.medicineCategory.findFirstOrThrow({
        where: { id },
      });
      await this.emitChange(
        tx,
        category,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toMedicineCategoryResponse(category);
    });
  }

  async delete(id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.medicineCategory.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.MEDICINE_CATEGORY_NOT_FOUND,
          `Medicine category not found: ${id}`,
          { id: id.toString() },
        );
      }

      await assertCategoryNotInUse(tx, id);

      const updateResult = await tx.medicineCategory.updateMany({
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
        `Medicine category version conflict or not found: ${id}`,
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

  private async emitChange(
    tx: TxClient,
    category: MedicineCategory,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.MEDICINE_CATEGORY,
      entityId: category.id,
      entityUuid: category.uuid,
      action,
      module: AuditModule.MEDICINE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.MEDICINE_CATEGORY,
      entityUuid: category.uuid,
      operation,
      payload: { uuid: category.uuid, categoryCode: category.categoryCode },
    });
  }
}
