import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma, RolePermission } from '@prisma/client';
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
import { CreateRolePermissionDto } from '../dto/create-role-permission.dto';
import { ReplaceRolePermissionsDto } from '../dto/replace-role-permissions.dto';
import { UpdateRolePermissionDto } from '../dto/update-role-permission.dto';
import { toRolePermissionResponse } from '../mappers/role-permission.mapper';
import { invalidateSessionsForRole } from '../utils/session.util';
import {
  assertPermissionExists,
  assertRoleExists,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/security.util';

@Injectable()
export class RolePermissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(roleId: bigint, query: PaginationQueryDto) {
    await this.ensureRoleExists(roleId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.RolePermissionWhereInput = {
      roleId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.rolePermission.count({ where }),
      this.prisma.client.rolePermission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toRolePermissionResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(roleId: bigint, id: bigint) {
    const rolePermission = await this.findActive(roleId, id);
    return toRolePermissionResponse(rolePermission);
  }

  async create(roleId: bigint, dto: CreateRolePermissionDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertRoleExists(tx, roleId);
      await assertPermissionExists(tx, dto.permissionId);

      const existingActive = await tx.rolePermission.findFirst({
        where: {
          roleId,
          permissionId: dto.permissionId,
          deletedAt: null,
        },
      });

      if (existingActive) {
        throwConflict(
          ErrorCode.CONFLICT,
          `Role permission already exists for role ${roleId} and permission ${dto.permissionId}`,
          {
            roleId: roleId.toString(),
            permissionId: dto.permissionId.toString(),
          },
        );
      }

      const now = BigInt(Date.now());
      const softDeleted = await tx.rolePermission.findFirst({
        where: {
          roleId,
          permissionId: dto.permissionId,
          deletedAt: { not: null },
        },
      });

      const rolePermission = softDeleted
        ? await tx.rolePermission.update({
            where: { id: softDeleted.id },
            data: {
              isGranted: dto.isGranted ?? true,
              deletedAt: null,
              updatedAt: now,
              version: { increment: 1 },
            },
          })
        : await tx.rolePermission.create({
            data: {
              uuid: randomUUID(),
              roleId,
              permissionId: dto.permissionId,
              isGranted: dto.isGranted ?? true,
              createdAt: now,
              updatedAt: now,
            },
          });

      await invalidateSessionsForRole(tx, roleId, LogoutReason.FORCE_LOGOUT);

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.ROLE_PERMISSION,
        entityId: rolePermission.id,
        entityUuid: rolePermission.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.ROLE_PERMISSION,
        entityUuid: rolePermission.uuid,
        operation: OutboxOperation.CREATE,
        payload: {
          uuid: rolePermission.uuid,
          roleId: roleId.toString(),
          permissionId: dto.permissionId.toString(),
        },
      });

      return toRolePermissionResponse(rolePermission);
    });
  }

  async update(roleId: bigint, id: bigint, dto: UpdateRolePermissionDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.rolePermission.findFirst({
        where: { id, roleId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.ROLE_PERMISSION_NOT_FOUND,
          `Role permission not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.rolePermission.updateMany({
        where: { id, roleId, version: dto.version, deletedAt: null },
        data: {
          isGranted: dto.isGranted,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Role permission version conflict or not found: ${id}`,
      );

      await invalidateSessionsForRole(tx, roleId, LogoutReason.FORCE_LOGOUT);

      const rolePermission = await tx.rolePermission.findFirstOrThrow({
        where: { id },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.ROLE_PERMISSION,
        entityId: rolePermission.id,
        entityUuid: rolePermission.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.ROLE_PERMISSION,
        entityUuid: rolePermission.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: rolePermission.uuid },
      });

      return toRolePermissionResponse(rolePermission);
    });
  }

  async delete(roleId: bigint, id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.rolePermission.findFirst({
        where: { id, roleId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.ROLE_PERMISSION_NOT_FOUND,
          `Role permission not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.rolePermission.updateMany({
        where: { id, roleId, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Role permission version conflict or not found: ${id}`,
      );

      await invalidateSessionsForRole(tx, roleId, LogoutReason.FORCE_LOGOUT);

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.ROLE_PERMISSION,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.ROLE_PERMISSION,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }

  async replace(roleId: bigint, dto: ReplaceRolePermissionsDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertRoleExists(tx, roleId);

      const targetPermissionIds = new Set(dto.permissionIds);
      for (const permissionId of targetPermissionIds) {
        await assertPermissionExists(tx, permissionId);
      }

      const now = BigInt(Date.now());

      await tx.rolePermission.updateMany({
        where: { roleId, deletedAt: null },
        data: {
          deletedAt: now,
          updatedAt: now,
          version: { increment: 1 },
        },
      });

      const results: RolePermission[] = [];
      for (const permissionId of targetPermissionIds) {
        const existing = await tx.rolePermission.findFirst({
          where: { roleId, permissionId },
        });

        if (existing) {
          const restored = await tx.rolePermission.update({
            where: { id: existing.id },
            data: {
              isGranted: true,
              deletedAt: null,
              updatedAt: now,
              version: { increment: 1 },
            },
          });
          results.push(restored);
        } else {
          const created = await tx.rolePermission.create({
            data: {
              uuid: randomUUID(),
              roleId,
              permissionId,
              isGranted: true,
              createdAt: now,
              updatedAt: now,
            },
          });
          results.push(created);
        }
      }

      await invalidateSessionsForRole(tx, roleId, LogoutReason.FORCE_LOGOUT);

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.ROLE_PERMISSION,
        entityId: roleId,
        action: AuditAction.UPDATE,
        module: AuditModule.SECURITY,
        description: `Replaced permissions for role ${roleId}`,
      });

      return results.map(toRolePermissionResponse);
    });
  }

  private async ensureRoleExists(roleId: bigint) {
    const role = await this.prisma.client.role.findFirst({
      where: { id: roleId, deletedAt: null },
      select: { id: true },
    });

    if (!role) {
      throwNotFound(ErrorCode.ROLE_NOT_FOUND, `Role not found: ${roleId}`, {
        roleId: roleId.toString(),
      });
    }
  }

  private async findActive(roleId: bigint, id: bigint) {
    const rolePermission = await this.prisma.client.rolePermission.findFirst({
      where: { id, roleId, deletedAt: null },
    });

    if (!rolePermission) {
      throwNotFound(
        ErrorCode.ROLE_PERMISSION_NOT_FOUND,
        `Role permission not found: ${id}`,
        { id: id.toString() },
      );
    }

    return rolePermission;
  }
}
