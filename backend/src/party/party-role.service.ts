import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../audit/audit-action.constants';
import { AuditModule } from '../audit/audit-module.constants';
import { AuditService } from '../audit/audit.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ErrorCode } from '../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../common/response/paginated-result';
import { OutboxEntityType } from '../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../prisma.service';
import { CreatePartyRoleDto } from './dto/create-party-role.dto';
import { UpdatePartyRoleDto } from './dto/update-party-role.dto';
import { toPartyRoleResponse } from './mappers/party-role.mapper';
import {
  assertPartyExists,
  optimisticUpdate,
  throwNotFound,
} from './utils/party.util';

@Injectable()
export class PartyRoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(partyId: bigint, query: PaginationQueryDto) {
    await this.ensurePartyExists(partyId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.PartyRoleWhereInput = {
      partyId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.partyRole.count({ where }),
      this.prisma.client.partyRole.findMany({
        where,
        orderBy: { roleType: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPartyRoleResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(partyId: bigint, id: bigint) {
    const role = await this.findActive(partyId, id);
    return toPartyRoleResponse(role);
  }

  async create(partyId: bigint, dto: CreatePartyRoleDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertPartyExists(tx, partyId);

      const role = await tx.partyRole.create({
        data: {
          uuid: randomUUID(),
          partyId,
          roleType: dto.roleType,
          isPrimary: dto.isPrimary ?? false,
          isActive: dto.isActive ?? true,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PARTY_ROLE,
        entityId: role.id,
        entityUuid: role.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PARTY_ROLE,
        entityUuid: role.uuid,
        operation: OutboxOperation.CREATE,
        payload: {
          uuid: role.uuid,
          partyId: partyId.toString(),
          roleType: role.roleType,
        },
      });

      return toPartyRoleResponse(role);
    });
  }

  async update(partyId: bigint, id: bigint, dto: UpdatePartyRoleDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.partyRole.findFirst({
        where: { id, partyId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PARTY_ROLE_NOT_FOUND,
          `Party role not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.partyRole.updateMany({
        where: { id, partyId, version: dto.version, deletedAt: null },
        data: {
          roleType: dto.roleType,
          isPrimary: dto.isPrimary,
          isActive: dto.isActive,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        ErrorCode.PARTY_ROLE_NOT_FOUND,
        `Party role version conflict or not found: ${id}`,
        id,
      );

      const role = await tx.partyRole.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PARTY_ROLE,
        entityId: role.id,
        entityUuid: role.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PARTY_ROLE,
        entityUuid: role.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: role.uuid, roleType: role.roleType },
      });

      return toPartyRoleResponse(role);
    });
  }

  async delete(partyId: bigint, id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.partyRole.findFirst({
        where: { id, partyId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PARTY_ROLE_NOT_FOUND,
          `Party role not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.partyRole.updateMany({
        where: { id, partyId, version, deletedAt: null },
        data: { deletedAt: new Date(), version: { increment: 1 } },
      });

      optimisticUpdate(
        updateResult,
        ErrorCode.PARTY_ROLE_NOT_FOUND,
        `Party role version conflict or not found: ${id}`,
        id,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PARTY_ROLE,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PARTY_ROLE,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }

  private async ensurePartyExists(partyId: bigint) {
    const party = await this.prisma.client.party.findFirst({
      where: { id: partyId, deletedAt: null },
      select: { id: true },
    });

    if (!party) {
      throwNotFound(ErrorCode.PARTY_NOT_FOUND, `Party not found: ${partyId}`, {
        partyId: partyId.toString(),
      });
    }
  }

  private async findActive(partyId: bigint, id: bigint) {
    const role = await this.prisma.client.partyRole.findFirst({
      where: { id, partyId, deletedAt: null },
    });

    if (!role) {
      throwNotFound(
        ErrorCode.PARTY_ROLE_NOT_FOUND,
        `Party role not found: ${id}`,
        { id: id.toString() },
      );
    }

    return role;
  }
}
