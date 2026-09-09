import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Manufacturer, Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { CreateManufacturerDto } from '../dto/create-manufacturer.dto';
import { ManufacturerListQueryDto } from '../dto/manufacturer-list-query.dto';
import { UpdateManufacturerDto } from '../dto/update-manufacturer.dto';
import { toManufacturerResponse } from '../mappers/manufacturer.mapper';
import {
  assertManufacturerFieldUnique,
  assertManufacturerNotInUse,
  assertPartyExistsForManufacturer,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/medicine.util';

@Injectable()
export class ManufacturerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: ManufacturerListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.ManufacturerWhereInput = {
      deletedAt: null,
      party: { deletedAt: null },
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.isPreferred !== undefined
        ? { isPreferred: query.isPreferred }
        : {}),
      ...(search
        ? {
            OR: [
              { manufacturerCode: { contains: search } },
              { manufacturingLicenseNo: { contains: search } },
              { gstin: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.manufacturer.count({ where }),
      this.prisma.client.manufacturer.findMany({
        where,
        orderBy: { manufacturerCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toManufacturerResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const manufacturer = await this.prisma.client.manufacturer.findFirst({
      where: { id, deletedAt: null, party: { deletedAt: null } },
    });

    if (!manufacturer) {
      throwNotFound(
        ErrorCode.MANUFACTURER_NOT_FOUND,
        `Manufacturer not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toManufacturerResponse(manufacturer);
  }

  async create(dto: CreateManufacturerDto) {
    return this.unitOfWork.run(async (tx) => {
      const partyId = dto.partyId;
      await assertPartyExistsForManufacturer(tx, partyId);
      await assertManufacturerFieldUnique(
        tx,
        'manufacturerCode',
        dto.manufacturerCode,
        'Manufacturer code',
      );

      if (dto.manufacturingLicenseNo) {
        await assertManufacturerFieldUnique(
          tx,
          'manufacturingLicenseNo',
          dto.manufacturingLicenseNo,
          'Manufacturing license number',
        );
      }

      if (dto.gstin) {
        await assertManufacturerFieldUnique(tx, 'gstin', dto.gstin, 'GSTIN');
      }

      const existingActive = await tx.manufacturer.findFirst({
        where: { partyId, deletedAt: null },
      });

      if (existingActive) {
        throwConflict(
          ErrorCode.MANUFACTURER_ALREADY_EXISTS,
          `Manufacturer already exists for party: ${partyId}`,
          { partyId: partyId.toString() },
        );
      }

      const softDeleted = await tx.manufacturer.findFirst({
        where: { partyId, deletedAt: { not: null } },
      });

      const now = BigInt(Date.now());
      const manufacturer = softDeleted
        ? await tx.manufacturer.update({
            where: { id: softDeleted.id },
            data: {
              manufacturerCode: dto.manufacturerCode,
              manufacturingLicenseNo: dto.manufacturingLicenseNo,
              gstin: dto.gstin,
              website: dto.website,
              email: dto.email,
              supportPhone: dto.supportPhone,
              isPreferred: dto.isPreferred ?? false,
              isActive: dto.isActive ?? true,
              deletedAt: null,
              updatedAt: now,
              version: { increment: 1 },
            },
          })
        : await tx.manufacturer.create({
            data: {
              uuid: randomUUID(),
              partyId,
              manufacturerCode: dto.manufacturerCode,
              manufacturingLicenseNo: dto.manufacturingLicenseNo,
              gstin: dto.gstin,
              website: dto.website,
              email: dto.email,
              supportPhone: dto.supportPhone,
              isPreferred: dto.isPreferred ?? false,
              isActive: dto.isActive ?? true,
              createdAt: now,
              updatedAt: now,
            },
          });

      await this.emitChange(
        tx,
        manufacturer,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toManufacturerResponse(manufacturer);
    });
  }

  async update(id: bigint, dto: UpdateManufacturerDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.manufacturer.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.MANUFACTURER_NOT_FOUND,
          `Manufacturer not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (
        dto.manufacturerCode &&
        dto.manufacturerCode !== existing.manufacturerCode
      ) {
        await assertManufacturerFieldUnique(
          tx,
          'manufacturerCode',
          dto.manufacturerCode,
          'Manufacturer code',
          id,
        );
      }

      if (
        dto.manufacturingLicenseNo &&
        dto.manufacturingLicenseNo !== existing.manufacturingLicenseNo
      ) {
        await assertManufacturerFieldUnique(
          tx,
          'manufacturingLicenseNo',
          dto.manufacturingLicenseNo,
          'Manufacturing license number',
          id,
        );
      }

      if (dto.gstin && dto.gstin !== existing.gstin) {
        await assertManufacturerFieldUnique(
          tx,
          'gstin',
          dto.gstin,
          'GSTIN',
          id,
        );
      }

      const updateResult = await tx.manufacturer.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          manufacturerCode: dto.manufacturerCode,
          manufacturingLicenseNo: dto.manufacturingLicenseNo,
          gstin: dto.gstin,
          website: dto.website,
          email: dto.email,
          supportPhone: dto.supportPhone,
          isPreferred: dto.isPreferred,
          isActive: dto.isActive,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Manufacturer version conflict or not found: ${id}`,
      );

      const manufacturer = await tx.manufacturer.findFirstOrThrow({
        where: { id },
      });
      await this.emitChange(
        tx,
        manufacturer,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toManufacturerResponse(manufacturer);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.manufacturer.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.MANUFACTURER_NOT_FOUND,
          `Manufacturer not found: ${id}`,
          { id: id.toString() },
        );
      }

      await assertManufacturerNotInUse(tx, id);

      const updateResult = await tx.manufacturer.updateMany({
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
        `Manufacturer version conflict or not found: ${id}`,
      );

      await this.emitChange(
        tx,
        existing,
        AuditAction.DELETE,
        OutboxOperation.DELETE,
      );
      return { id: id.toString(), deleted: true };
    });
  }

  private async emitChange(
    tx: TxClient,
    manufacturer: Manufacturer,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.MANUFACTURER,
      entityId: manufacturer.id,
      entityUuid: manufacturer.uuid,
      action,
      module: AuditModule.MEDICINE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.MANUFACTURER,
      entityUuid: manufacturer.uuid,
      operation,
      payload: {
        uuid: manufacturer.uuid,
        manufacturerCode: manufacturer.manufacturerCode,
      },
    });
  }
}
