import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { LogoutReason } from '../constants/security.constants';
import { CreateUserBranchDto } from '../dto/create-user-branch.dto';
import { UpdateUserBranchDto } from '../dto/update-user-branch.dto';
import { toUserBranchResponse } from '../mappers/user-branch.mapper';
import { assertBranchExists } from '../../configuration/utils/configuration.util';
import { invalidateUserSessions } from '../../persistence/user-session/session.util';
import {
  assertUserExists,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/security.util';

@Injectable()
export class UserBranchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(userId: bigint, query: PaginationQueryDto) {
    await assertUserExists(this.prisma.client, userId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.UserBranchWhereInput = {
      userId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.userBranch.count({ where }),
      this.prisma.client.userBranch.findMany({
        where,
        orderBy: { branchId: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toUserBranchResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(userId: bigint, id: bigint) {
    const userBranch = await this.findActive(userId, id);
    return toUserBranchResponse(userBranch);
  }

  async create(userId: bigint, dto: CreateUserBranchDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertUserExists(tx, userId);
      await assertBranchExists(tx, dto.branchId);

      const existingActive = await tx.userBranch.findFirst({
        where: {
          userId,
          branchId: dto.branchId,
          deletedAt: null,
        },
      });

      if (existingActive) {
        throwConflict(
          ErrorCode.CONFLICT,
          `User branch already exists for user ${userId} and branch ${dto.branchId}`,
          {
            userId: userId.toString(),
            branchId: dto.branchId.toString(),
          },
        );
      }

      const now = BigInt(Date.now());
      const softDeleted = await tx.userBranch.findFirst({
        where: {
          userId,
          branchId: dto.branchId,
          deletedAt: { not: null },
        },
      });

      const userBranch = softDeleted
        ? await tx.userBranch.update({
            where: { id: softDeleted.id },
            data: {
              isActive: dto.isActive ?? true,
              deletedAt: null,
              updatedAt: now,
              version: { increment: 1 },
            },
          })
        : await tx.userBranch.create({
            data: {
              uuid: randomUUID(),
              userId,
              branchId: dto.branchId,
              isActive: dto.isActive ?? true,
              createdAt: now,
              updatedAt: now,
            },
          });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.USER_BRANCH,
        entityId: userBranch.id,
        entityUuid: userBranch.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.USER_BRANCH,
        entityUuid: userBranch.uuid,
        operation: OutboxOperation.CREATE,
        payload: {
          uuid: userBranch.uuid,
          userId: userId.toString(),
          branchId: dto.branchId.toString(),
        },
      });

      return toUserBranchResponse(userBranch);
    });
  }

  async update(userId: bigint, id: bigint, dto: UpdateUserBranchDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.userBranch.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.USER_BRANCH_NOT_FOUND,
          `User branch not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.userBranch.updateMany({
        where: { id, userId, version: dto.version, deletedAt: null },
        data: {
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `User branch version conflict or not found: ${id}`,
      );

      if (dto.isActive === false && existing.isActive) {
        await invalidateUserSessions(tx, userId, LogoutReason.FORCE_LOGOUT);
      }

      const userBranch = await tx.userBranch.findFirstOrThrow({
        where: { id },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.USER_BRANCH,
        entityId: userBranch.id,
        entityUuid: userBranch.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.USER_BRANCH,
        entityUuid: userBranch.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: userBranch.uuid },
      });

      return toUserBranchResponse(userBranch);
    });
  }

  async delete(userId: bigint, id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.userBranch.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.USER_BRANCH_NOT_FOUND,
          `User branch not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.userBranch.updateMany({
        where: { id, userId, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `User branch version conflict or not found: ${id}`,
      );

      await invalidateUserSessions(tx, userId, LogoutReason.FORCE_LOGOUT);

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.USER_BRANCH,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.USER_BRANCH,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }

  private async findActive(userId: bigint, id: bigint) {
    const userBranch = await this.prisma.client.userBranch.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!userBranch) {
      throwNotFound(
        ErrorCode.USER_BRANCH_NOT_FOUND,
        `User branch not found: ${id}`,
        { id: id.toString() },
      );
    }

    return userBranch;
  }
}
