import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { PasswordService } from '../../auth/password.service';
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
import { CreateUserDto } from '../dto/create-user.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { toUserResponse } from '../mappers/user.mapper';
import { invalidateUserSessions } from '../../persistence/user-session/session.util';
import {
  assertEmployeeAvailableForUser,
  assertUsernameUnique,
  optimisticUpdate,
  throwNotFound,
} from '../utils/security.util';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly passwordService: PasswordService,
  ) {}

  async list(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(search ? { username: { contains: search } } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.user.count({ where }),
      this.prisma.client.user.findMany({
        where,
        orderBy: { username: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toUserResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const user = await this.prisma.client.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throwNotFound(ErrorCode.USER_NOT_FOUND, `User not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toUserResponse(user);
  }

  async create(dto: CreateUserDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertEmployeeAvailableForUser(tx, dto.employeeId);
      await assertUsernameUnique(tx, dto.username);

      const passwordHash = await this.passwordService.hash(dto.password);
      const now = BigInt(Date.now());

      const softDeleted = await tx.user.findFirst({
        where: { employeeId: dto.employeeId, deletedAt: { not: null } },
      });

      const user = softDeleted
        ? await tx.user.update({
            where: { id: softDeleted.id },
            data: {
              username: dto.username,
              passwordHash,
              isActive: dto.isActive ?? true,
              mustChangePassword: dto.mustChangePassword ?? false,
              failedLoginAttempts: 0,
              lockedUntil: null,
              deletedAt: null,
              updatedAt: now,
              version: { increment: 1 },
            },
          })
        : await tx.user.create({
            data: {
              uuid: randomUUID(),
              employeeId: dto.employeeId,
              username: dto.username,
              passwordHash,
              isActive: dto.isActive ?? true,
              mustChangePassword: dto.mustChangePassword ?? false,
              createdAt: now,
              updatedAt: now,
            },
          });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.USER,
        entityId: user.id,
        entityUuid: user.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.USER,
        entityUuid: user.uuid,
        operation: OutboxOperation.CREATE,
        payload: { uuid: user.uuid, username: user.username },
      });

      return toUserResponse(user);
    });
  }

  async update(id: bigint, dto: UpdateUserDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.user.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.USER_NOT_FOUND, `User not found: ${id}`, {
          id: id.toString(),
        });
      }

      const updateResult = await tx.user.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          isActive: dto.isActive,
          mustChangePassword: dto.mustChangePassword,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `User version conflict or not found: ${id}`,
      );

      if (dto.isActive === false && existing.isActive) {
        await invalidateUserSessions(tx, id, LogoutReason.FORCE_LOGOUT);
      }

      const user = await tx.user.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.USER,
        entityId: user.id,
        entityUuid: user.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.USER,
        entityUuid: user.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: user.uuid, username: user.username },
      });

      return toUserResponse(user);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.user.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.USER_NOT_FOUND, `User not found: ${id}`, {
          id: id.toString(),
        });
      }

      const updateResult = await tx.user.updateMany({
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
        `User version conflict or not found: ${id}`,
      );

      await invalidateUserSessions(tx, id, LogoutReason.FORCE_LOGOUT);

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.USER,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.USER,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }

  async resetPassword(id: bigint, dto: ResetPasswordDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.user.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.USER_NOT_FOUND, `User not found: ${id}`, {
          id: id.toString(),
        });
      }

      const passwordHash = await this.passwordService.hash(dto.newPassword);
      const now = BigInt(Date.now());

      const user = await tx.user.update({
        where: { id },
        data: {
          passwordHash,
          passwordChangedAt: now,
          mustChangePassword: dto.mustChangePassword ?? false,
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedAt: now,
          version: { increment: 1 },
        },
      });

      await invalidateUserSessions(tx, id, LogoutReason.PASSWORD_CHANGED);

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.USER,
        entityId: user.id,
        entityUuid: user.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.SECURITY,
        description: `Password reset for ${user.username}`,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.USER,
        entityUuid: user.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: user.uuid, username: user.username },
      });

      return toUserResponse(user);
    });
  }

  async unlock(id: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.user.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.USER_NOT_FOUND, `User not found: ${id}`, {
          id: id.toString(),
        });
      }

      const user = await tx.user.update({
        where: { id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.USER,
        entityId: user.id,
        entityUuid: user.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.SECURITY,
        description: `Account unlocked for ${user.username}`,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.USER,
        entityUuid: user.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: user.uuid, username: user.username },
      });

      return toUserResponse(user);
    });
  }
}
