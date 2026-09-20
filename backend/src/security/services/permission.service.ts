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
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { toPermissionResponse } from '../mappers/permission.mapper';
import { optimisticUpdate, throwNotFound } from '../utils/security.util';

@Injectable()
export class PermissionService {
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

    const where: Prisma.PermissionWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { permissionCode: { contains: search } },
              { permissionName: { contains: search } },
              { module: { contains: search } },
              { resource: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.permission.count({ where }),
      this.prisma.client.permission.findMany({
        where,
        orderBy: [{ module: 'asc' }, { resource: 'asc' }, { action: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPermissionResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const permission = await this.prisma.client.permission.findFirst({
      where: { id, deletedAt: null },
    });

    if (!permission) {
      throwNotFound(
        ErrorCode.PERMISSION_NOT_FOUND,
        `Permission not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toPermissionResponse(permission);
  }

  async create(dto: CreatePermissionDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.permission.findFirst({
        where: { permissionCode: dto.permissionCode, deletedAt: null },
      });

      if (existing) {
        throw new ApplicationException(
          ErrorCode.CONFLICT,
          `Permission code already exists: ${dto.permissionCode}`,
          HttpStatus.CONFLICT,
          { permissionCode: dto.permissionCode },
        );
      }

      const now = BigInt(Date.now());
      const permission = await tx.permission.create({
        data: {
          uuid: randomUUID(),
          permissionCode: dto.permissionCode,
          permissionName: dto.permissionName,
          module: dto.module,
          resource: dto.resource,
          action: dto.action,
          description: dto.description,
          isSystemPermission: false,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PERMISSION,
        entityId: permission.id,
        entityUuid: permission.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PERMISSION,
        entityUuid: permission.uuid,
        operation: OutboxOperation.CREATE,
        payload: {
          uuid: permission.uuid,
          permissionCode: permission.permissionCode,
        },
      });

      return toPermissionResponse(permission);
    });
  }

  async update(id: bigint, dto: UpdatePermissionDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.permission.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PERMISSION_NOT_FOUND,
          `Permission not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.permission.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          permissionCode: dto.permissionCode,
          permissionName: dto.permissionName,
          module: dto.module,
          resource: dto.resource,
          action: dto.action,
          description: dto.description,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Permission version conflict or not found: ${id}`,
      );

      const permission = await tx.permission.findFirstOrThrow({
        where: { id },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PERMISSION,
        entityId: permission.id,
        entityUuid: permission.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PERMISSION,
        entityUuid: permission.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: permission.uuid,
          permissionCode: permission.permissionCode,
        },
      });

      return toPermissionResponse(permission);
    });
  }

  async delete(id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.permission.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PERMISSION_NOT_FOUND,
          `Permission not found: ${id}`,
          { id: id.toString() },
        );
      }

      const inUse = await tx.rolePermission.findFirst({
        where: { permissionId: id, deletedAt: null },
      });

      if (inUse) {
        throw new ApplicationException(
          ErrorCode.PERMISSION_IN_USE,
          `Permission is assigned to roles: ${id}`,
          HttpStatus.CONFLICT,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.permission.updateMany({
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
        `Permission version conflict or not found: ${id}`,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PERMISSION,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.SECURITY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PERMISSION,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }
}
