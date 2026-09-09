import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { LogoutReason } from '../constants/security.constants';
import { CreateUserRoleDto } from '../dto/create-user-role.dto';
import { ReplaceUserRolesDto } from '../dto/replace-user-roles.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { toUserRoleResponse } from '../mappers/user-role.mapper';
import { invalidateUserSessions } from '../utils/session.util';
import {
  assertRoleExists,
  assertUserExists,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/security.util';

@Injectable()
export class UserRoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(userId: bigint, query: PaginationQueryDto) {
    await this.ensureUserExists(userId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.UserRoleWhereInput = {
      userId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.userRole.count({ where }),
      this.prisma.client.userRole.findMany({
        where,
        orderBy: { assignedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toUserRoleResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(userId: bigint, id: bigint) {
    const userRole = await this.findActive(userId, id);
    return toUserRoleResponse(userRole);
  }

  async create(userId: bigint, dto: CreateUserRoleDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertUserExists(tx, userId);
      await assertRoleExists(tx, dto.roleId);

      const existingActive = await tx.userRole.findFirst({
        where: { userId, roleId: dto.roleId, deletedAt: null },
      });

      if (existingActive) {
        throwConflict(
          ErrorCode.CONFLICT,
          `User role already exists for user ${userId} and role ${dto.roleId}`,
          {
            userId: userId.toString(),
            roleId: dto.roleId.toString(),
          },
        );
      }

      const now = BigInt(Date.now());
      const assignedByUserId = this.requestContext.tryGet()?.userId;

      const softDeleted = await tx.userRole.findFirst({
        where: { userId, roleId: dto.roleId, deletedAt: { not: null } },
      });

      const userRole = softDeleted
        ? await tx.userRole.update({
            where: { id: softDeleted.id },
            data: {
              isActive: dto.isActive ?? true,
              assignedAt: now,
              assignedByUserId,
              deletedAt: null,
              updatedAt: now,
              version: { increment: 1 },
            },
          })
        : await tx.userRole.create({
            data: {
              uuid: randomUUID(),
              userId,
              roleId: dto.roleId,
              assignedAt: now,
              assignedByUserId,
              isActive: dto.isActive ?? true,
              createdAt: now,
              updatedAt: now,
            },
          });

      await invalidateUserSessions(tx, userId, LogoutReason.FORCE_LOGOUT);

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.USER_ROLE,
        entityId: userRole.id,
        entityUuid: userRole.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.USER_ROLE,
        entityUuid: userRole.uuid,
        operation: OutboxOperation.CREATE,
        payload: {
          uuid: userRole.uuid,
          userId: userId.toString(),
          roleId: dto.roleId.toString(),
        },
      });

      return toUserRoleResponse(userRole);
    });
  }

  async update(userId: bigint, id: bigint, dto: UpdateUserRoleDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.userRole.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.USER_ROLE_NOT_FOUND,
          `User role not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.userRole.updateMany({
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
        `User role version conflict or not found: ${id}`,
      );

      await invalidateUserSessions(tx, userId, LogoutReason.FORCE_LOGOUT);

      const userRole = await tx.userRole.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.USER_ROLE,
        entityId: userRole.id,
        entityUuid: userRole.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.USER_ROLE,
        entityUuid: userRole.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: userRole.uuid },
      });

      return toUserRoleResponse(userRole);
    });
  }

  async delete(userId: bigint, id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.userRole.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.USER_ROLE_NOT_FOUND,
          `User role not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.userRole.updateMany({
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
        `User role version conflict or not found: ${id}`,
      );

      await invalidateUserSessions(tx, userId, LogoutReason.FORCE_LOGOUT);

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.USER_ROLE,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.USER_ROLE,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }

  async replace(userId: bigint, dto: ReplaceUserRolesDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertUserExists(tx, userId);

      const targetRoleIds = new Set(dto.roleIds);
      for (const roleId of targetRoleIds) {
        await assertRoleExists(tx, roleId);
      }

      const currentRoles = await tx.userRole.findMany({
        where: { userId, deletedAt: null },
      });

      const now = BigInt(Date.now());
      const assignedByUserId = this.requestContext.tryGet()?.userId;

      for (const currentRole of currentRoles) {
        if (!targetRoleIds.has(currentRole.roleId)) {
          await tx.userRole.update({
            where: { id: currentRole.id },
            data: {
              deletedAt: now,
              updatedAt: now,
              version: { increment: 1 },
            },
          });
        }
      }

      const results: UserRole[] = [];
      for (const roleId of targetRoleIds) {
        const existing = await tx.userRole.findFirst({
          where: { userId, roleId },
        });

        if (existing) {
          const restored = await tx.userRole.update({
            where: { id: existing.id },
            data: {
              isActive: true,
              assignedAt: now,
              assignedByUserId,
              deletedAt: null,
              updatedAt: now,
              version: { increment: 1 },
            },
          });
          results.push(restored);
        } else {
          const created = await tx.userRole.create({
            data: {
              uuid: randomUUID(),
              userId,
              roleId,
              assignedAt: now,
              assignedByUserId,
              isActive: true,
              createdAt: now,
              updatedAt: now,
            },
          });
          results.push(created);
        }
      }

      await invalidateUserSessions(tx, userId, LogoutReason.FORCE_LOGOUT);

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.USER_ROLE,
        entityId: userId,
        action: AuditAction.UPDATE,
        module: AuditModule.SECURITY,
        description: `Replaced roles for user ${userId}`,
      });

      return results.map(toUserRoleResponse);
    });
  }

  private async ensureUserExists(userId: bigint) {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throwNotFound(ErrorCode.USER_NOT_FOUND, `User not found: ${userId}`, {
        userId: userId.toString(),
      });
    }
  }

  private async findActive(userId: bigint, id: bigint) {
    const userRole = await this.prisma.client.userRole.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!userRole) {
      throwNotFound(
        ErrorCode.USER_ROLE_NOT_FOUND,
        `User role not found: ${id}`,
        { id: id.toString() },
      );
    }

    return userRole;
  }
}
