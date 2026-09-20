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
import { CreatePartyAddressDto } from '../dto/create-party-address.dto';
import { UpdatePartyAddressDto } from '../dto/update-party-address.dto';
import { toPartyAddressResponse } from '../mappers/party-address.mapper';
import {
  assertPartyExists,
  optimisticUpdate,
  throwNotFound,
} from '../utils/party.util';

@Injectable()
export class PartyAddressService {
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

    const where: Prisma.PartyAddressWhereInput = {
      partyId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.partyAddress.count({ where }),
      this.prisma.client.partyAddress.findMany({
        where,
        orderBy: { addressType: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPartyAddressResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(partyId: bigint, id: bigint) {
    await this.ensurePartyExists(partyId);
    const address = await this.findActive(partyId, id);
    return toPartyAddressResponse(address);
  }

  async create(partyId: bigint, dto: CreatePartyAddressDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertPartyExists(tx, partyId);

      if (dto.isDefault ?? false) {
        await tx.partyAddress.updateMany({
          where: {
            partyId,
            addressType: dto.addressType,
            isDefault: true,
            deletedAt: null,
          },
          data: { isDefault: false },
        });
      }

      const address = await tx.partyAddress.create({
        data: {
          uuid: randomUUID(),
          partyId,
          addressType: dto.addressType,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          landmark: dto.landmark,
          area: dto.area,
          cityId: dto.cityId,
          stateId: dto.stateId,
          countryId: dto.countryId,
          postalCode: dto.postalCode,
          latitude: dto.latitude,
          longitude: dto.longitude,
          isDefault: dto.isDefault ?? false,
          isActive: dto.isActive ?? true,
          createdAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PARTY_ADDRESS,
        entityId: address.id,
        entityUuid: address.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PARTY_ADDRESS,
        entityUuid: address.uuid,
        operation: OutboxOperation.CREATE,
        payload: { uuid: address.uuid, partyId: partyId.toString() },
      });

      return toPartyAddressResponse(address);
    });
  }

  async update(partyId: bigint, id: bigint, dto: UpdatePartyAddressDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.partyAddress.findFirst({
        where: { id, partyId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PARTY_ADDRESS_NOT_FOUND,
          `Party address not found: ${id}`,
          { id: id.toString() },
        );
      }

      const addressType = dto.addressType ?? existing.addressType;

      if (dto.isDefault ?? false) {
        await tx.partyAddress.updateMany({
          where: {
            partyId,
            addressType,
            isDefault: true,
            deletedAt: null,
            NOT: { id },
          },
          data: { isDefault: false },
        });
      }

      const updateResult = await tx.partyAddress.updateMany({
        where: { id, partyId, version: dto.version, deletedAt: null },
        data: {
          addressType: dto.addressType,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          landmark: dto.landmark,
          area: dto.area,
          cityId: dto.cityId,
          stateId: dto.stateId,
          countryId: dto.countryId,
          postalCode: dto.postalCode,
          latitude: dto.latitude,
          longitude: dto.longitude,
          isDefault: dto.isDefault,
          isActive: dto.isActive,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Party address version conflict or not found: ${id}`,
      );

      const address = await tx.partyAddress.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PARTY_ADDRESS,
        entityId: address.id,
        entityUuid: address.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PARTY_ADDRESS,
        entityUuid: address.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: address.uuid },
      });

      return toPartyAddressResponse(address);
    });
  }

  async delete(partyId: bigint, id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.partyAddress.findFirst({
        where: { id, partyId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PARTY_ADDRESS_NOT_FOUND,
          `Party address not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.partyAddress.updateMany({
        where: { id, partyId, version, deletedAt: null },
        data: { deletedAt: BigInt(Date.now()), version: { increment: 1 } },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Party address version conflict or not found: ${id}`,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PARTY_ADDRESS,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PARTY_ADDRESS,
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
    const address = await this.prisma.client.partyAddress.findFirst({
      where: { id, partyId, deletedAt: null },
    });

    if (!address) {
      throwNotFound(
        ErrorCode.PARTY_ADDRESS_NOT_FOUND,
        `Party address not found: ${id}`,
        { id: id.toString() },
      );
    }

    return address;
  }
}
