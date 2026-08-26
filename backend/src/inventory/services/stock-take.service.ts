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
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';
import { UpdateStockMovementDto } from '../dto/update-stock-movement.dto';
import { toPartyResponse } from '../mappers/stock-adjustment.mapper';
import {
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/inventory.util';

@Injectable()
export class StockTakeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.PartyWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { displayName: { contains: search } },
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { organizationName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.party.count({ where }),
      this.prisma.client.party.findMany({
        where,
        orderBy: { displayName: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPartyResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const party = await this.prisma.client.party.findFirst({
      where: { id, deletedAt: null },
    });

    if (!party) {
      throwNotFound(ErrorCode.PARTY_NOT_FOUND, `Party not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toPartyResponse(party);
  }

  async create(dto: CreateStockMovementDto) {
    return this.unitOfWork.run(async (tx) => {
      const party = await tx.party.create({
        data: {
          uuid: randomUUID(),
          partyType: dto.partyType,
          displayName: dto.displayName,
          firstName: dto.firstName,
          middleName: dto.middleName,
          lastName: dto.lastName,
          organizationName: dto.organizationName,
          isActive: dto.isActive ?? true,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PARTY,
        entityId: party.id,
        entityUuid: party.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PARTY,
        entityUuid: party.uuid,
        operation: OutboxOperation.CREATE,
        payload: { uuid: party.uuid, displayName: party.displayName },
      });

      return toPartyResponse(party);
    });
  }

  async update(id: bigint, dto: UpdateStockMovementDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.party.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.PARTY_NOT_FOUND, `Party not found: ${id}`, {
          id: id.toString(),
        });
      }

      const updateResult = await tx.party.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          partyType: dto.partyType,
          displayName: dto.displayName,
          firstName: dto.firstName,
          middleName: dto.middleName,
          lastName: dto.lastName,
          organizationName: dto.organizationName,
          isActive: dto.isActive,
          updatedBy: this.requestContext.tryGet()?.userId,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Party version conflict or not found: ${id}`,
      );

      const party = await tx.party.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PARTY,
        entityId: party.id,
        entityUuid: party.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PARTY,
        entityUuid: party.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: party.uuid, displayName: party.displayName },
      });

      return toPartyResponse(party);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.party.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.PARTY_NOT_FOUND, `Party not found: ${id}`, {
          id: id.toString(),
        });
      }

      const [
        activeCustomer,
        activeSupplier,
        activeDoctor,
        activeEmployee,
        activeRole,
        activeContact,
        activeAddress,
      ] = await Promise.all([
        tx.customer.findFirst({
          where: { partyId: id, deletedAt: null },
          select: { id: true },
        }),
        tx.supplier.findFirst({
          where: { partyId: id, deletedAt: null },
          select: { id: true },
        }),
        tx.doctor.findFirst({
          where: { partyId: id, deletedAt: null },
          select: { id: true },
        }),
        tx.employee.findFirst({
          where: { partyId: id, deletedAt: null },
          select: { id: true },
        }),
        tx.partyRole.findFirst({
          where: { partyId: id, deletedAt: null },
          select: { id: true },
        }),
        tx.partyContact.findFirst({
          where: { partyId: id, deletedAt: null },
          select: { id: true },
        }),
        tx.partyAddress.findFirst({
          where: { partyId: id, deletedAt: null },
          select: { id: true },
        }),
      ]);

      if (
        activeCustomer ||
        activeSupplier ||
        activeDoctor ||
        activeEmployee ||
        activeRole ||
        activeContact ||
        activeAddress
      ) {
        throwConflict(`Cannot delete party with active children: ${id}`, {
          partyId: id.toString(),
        });
      }

      const updateResult = await tx.party.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: new Date(),
          deletedBy: this.requestContext.tryGet()?.userId,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Party version conflict or not found: ${id}`,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PARTY,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PARTY,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }
}
