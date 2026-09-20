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
import { ContactType } from '../constants/party.constants';
import { CreatePartyContactDto } from '../dto/create-party-contact.dto';
import { UpdatePartyContactDto } from '../dto/update-party-contact.dto';
import { toPartyContactResponse } from '../mappers/party-contact.mapper';
import {
  assertPartyExists,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/party.util';

@Injectable()
export class PartyContactService {
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

    const where: Prisma.PartyContactWhereInput = {
      partyId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.partyContact.count({ where }),
      this.prisma.client.partyContact.findMany({
        where,
        orderBy: { contactType: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPartyContactResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(partyId: bigint, id: bigint) {
    await this.ensurePartyExists(partyId);
    const contact = await this.findActive(partyId, id);
    return toPartyContactResponse(contact);
  }

  async create(partyId: bigint, dto: CreatePartyContactDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertPartyExists(tx, partyId);

      const contactValue = this.normalizeContactValue(
        dto.contactType,
        dto.contactValue,
      );

      const existingActive = await tx.partyContact.findFirst({
        where: {
          partyId,
          contactType: dto.contactType,
          contactValue,
          deletedAt: null,
        },
      });

      if (existingActive) {
        throwConflict(
          `Party contact already exists: ${dto.contactType} ${contactValue}`,
          {
            partyId: partyId.toString(),
            contactType: dto.contactType,
            contactValue,
          },
        );
      }

      const softDeleted = await tx.partyContact.findFirst({
        where: {
          partyId,
          contactType: dto.contactType,
          contactValue,
          deletedAt: { not: null },
        },
      });

      if (dto.isPrimary ?? false) {
        await tx.partyContact.updateMany({
          where: {
            partyId,
            contactType: dto.contactType,
            isPrimary: true,
            deletedAt: null,
          },
          data: { isPrimary: false },
        });
      }

      const contact = softDeleted
        ? await tx.partyContact.update({
            where: { id: softDeleted.id },
            data: {
              contactType: dto.contactType,
              contactValue,
              countryCode: dto.countryCode,
              isPrimary: dto.isPrimary ?? false,
              isVerified: dto.isVerified ?? false,
              isActive: dto.isActive ?? true,
              deletedAt: null,
              version: { increment: 1 },
            },
          })
        : await tx.partyContact.create({
            data: {
              uuid: randomUUID(),
              partyId,
              contactType: dto.contactType,
              contactValue,
              countryCode: dto.countryCode,
              isPrimary: dto.isPrimary ?? false,
              isVerified: dto.isVerified ?? false,
              isActive: dto.isActive ?? true,
              createdAt: BigInt(Date.now()),
              updatedAt: BigInt(Date.now()),
            },
          });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PARTY_CONTACT,
        entityId: contact.id,
        entityUuid: contact.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PARTY_CONTACT,
        entityUuid: contact.uuid,
        operation: OutboxOperation.CREATE,
        payload: { uuid: contact.uuid, partyId: partyId.toString() },
      });

      return toPartyContactResponse(contact);
    });
  }

  async update(partyId: bigint, id: bigint, dto: UpdatePartyContactDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.partyContact.findFirst({
        where: { id, partyId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PARTY_CONTACT_NOT_FOUND,
          `Party contact not found: ${id}`,
          { id: id.toString() },
        );
      }

      const contactType = dto.contactType ?? existing.contactType;
      const contactValue =
        dto.contactValue !== undefined || dto.contactType !== undefined
          ? this.normalizeContactValue(
              contactType,
              dto.contactValue ?? existing.contactValue,
            )
          : undefined;

      if (dto.isPrimary ?? false) {
        await tx.partyContact.updateMany({
          where: {
            partyId,
            contactType,
            isPrimary: true,
            deletedAt: null,
            NOT: { id },
          },
          data: { isPrimary: false },
        });
      }

      const updateResult = await tx.partyContact.updateMany({
        where: { id, partyId, version: dto.version, deletedAt: null },
        data: {
          contactType: dto.contactType,
          contactValue,
          countryCode: dto.countryCode,
          isPrimary: dto.isPrimary,
          isVerified: dto.isVerified,
          isActive: dto.isActive,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Party contact version conflict or not found: ${id}`,
      );

      const contact = await tx.partyContact.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PARTY_CONTACT,
        entityId: contact.id,
        entityUuid: contact.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PARTY_CONTACT,
        entityUuid: contact.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: contact.uuid },
      });

      return toPartyContactResponse(contact);
    });
  }

  async delete(partyId: bigint, id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.partyContact.findFirst({
        where: { id, partyId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PARTY_CONTACT_NOT_FOUND,
          `Party contact not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.partyContact.updateMany({
        where: { id, partyId, version, deletedAt: null },
        data: { deletedAt: BigInt(Date.now()), version: { increment: 1 } },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Party contact version conflict or not found: ${id}`,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.PARTY_CONTACT,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.PARTY_CONTACT,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }

  private normalizeContactValue(contactType: string, contactValue: string) {
    return contactType === ContactType.EMAIL
      ? contactValue.toLowerCase()
      : contactValue;
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
    const contact = await this.prisma.client.partyContact.findFirst({
      where: { id, partyId, deletedAt: null },
    });

    if (!contact) {
      throwNotFound(
        ErrorCode.PARTY_CONTACT_NOT_FOUND,
        `Party contact not found: ${id}`,
        { id: id.toString() },
      );
    }

    return contact;
  }
}
