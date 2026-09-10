import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApplicationException } from '../../common/exceptions/application.exception';
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
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { toRoleResponse } from '../mappers/role.mapper';
import { optimisticUpdate, throwNotFound } from '../utils/security.util';

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.RoleWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { roleCode: { contains: search } },
              { roleName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.role.count({ where }),
      this.prisma.client.role.findMany({
        where,
        orderBy: { roleCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toRoleResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const role = await this.prisma.client.role.findFirst({
      where: { id, deletedAt: null },
    });

    if (!role) {
      throwNotFound(ErrorCode.ROLE_NOT_FOUND, `Role not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toRoleResponse(role);
  }

  async create(dto: CreateRoleDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.role.findFirst({
        where: {
          OR: [
            { roleCode: dto.roleCode, deletedAt: null },
            { roleName: dto.roleName, deletedAt: null },
          ],
        },
      });

      if (existing) {
        throw new ApplicationException(
          ErrorCode.CONFLICT,
          `Role code or name already exists`,
          HttpStatus.CONFLICT,
          { roleCode: dto.roleCode, roleName: dto.roleName },
        );
      }

      const now = BigInt(Date.now());
      const role = await tx.role.create({
        data: {
          uuid: randomUUID(),
          roleCode: dto.roleCode,
          roleName: dto.roleName,
          description: dto.description,
          isSystemRole: false,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.ROLE,
        entityId: role.id,
        entityUuid: role.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.ROLE,
        entityUuid: role.uuid,
        operation: OutboxOperation.CREATE,
        payload: { uuid: role.uuid, roleCode: role.roleCode },
      });

      return toRoleResponse(role);
    });
  }

  async update(id: bigint, dto: UpdateRoleDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.role.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.ROLE_NOT_FOUND, `Role not found: ${id}`, {
          id: id.toString(),
        });
      }

      const updateResult = await tx.role.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          roleCode: dto.roleCode,
          roleName: dto.roleName,
          description: dto.description,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Role version conflict or not found: ${id}`,
      );

      const role = await tx.role.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.ROLE,
        entityId: role.id,
        entityUuid: role.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.ROLE,
        entityUuid: role.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: role.uuid, roleCode: role.roleCode },
      });

      return toRoleResponse(role);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.role.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.ROLE_NOT_FOUND, `Role not found: ${id}`, {
          id: id.toString(),
        });
      }

      const inUse = await tx.userRole.findFirst({
        where: { roleId: id, isActive: true, deletedAt: null },
      });

      if (inUse) {
        throw new ApplicationException(
          ErrorCode.ROLE_IN_USE,
          `Role is assigned to users: ${id}`,
          HttpStatus.CONFLICT,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.role.updateMany({
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
        `Role version conflict or not found: ${id}`,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.ROLE,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.ROLE,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }
}
