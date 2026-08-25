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
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { toEmployeeResponse } from './mappers/employee.mapper';
import {
  assertPartyExists,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from './utils/party.util';

@Injectable()
export class EmployeeService {
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

    const where: Prisma.EmployeeWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { employeeCode: { contains: search } },
              { designation: { contains: search } },
              { party: { displayName: { contains: search } } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.employee.count({ where }),
      this.prisma.client.employee.findMany({
        where,
        orderBy: { employeeCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toEmployeeResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const employee = await this.prisma.client.employee.findFirst({
      where: { id, deletedAt: null },
    });

    if (!employee) {
      throwNotFound(ErrorCode.EMPLOYEE_NOT_FOUND, `Employee not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toEmployeeResponse(employee);
  }

  async create(dto: CreateEmployeeDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertPartyExists(tx, BigInt(dto.partyId));

      const partyId = BigInt(dto.partyId);

      const existingDetail = await tx.employee.findFirst({
        where: { partyId, deletedAt: null },
      });

      if (existingDetail) {
        throwConflict(`Employee already exists for party: ${partyId}`, {
          partyId: partyId.toString(),
        });
      }

      const employee = await tx.employee.create({
        data: {
          uuid: randomUUID(),
          partyId,
          employeeCode: dto.employeeCode,
          designation: dto.designation,
          department: dto.department,
          joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
          salary: dto.salary,
          licenseNumber: dto.licenseNumber,
          isPharmacist: dto.isPharmacist ?? false,
          isActive: dto.isActive ?? true,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.EMPLOYEE,
        entityId: employee.id,
        entityUuid: employee.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.EMPLOYEE,
        entityUuid: employee.uuid,
        operation: OutboxOperation.CREATE,
        payload: { uuid: employee.uuid, employeeCode: employee.employeeCode },
      });

      return toEmployeeResponse(employee);
    });
  }

  async update(id: bigint, dto: UpdateEmployeeDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.employee.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.EMPLOYEE_NOT_FOUND,
          `Employee not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.employee.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          employeeCode: dto.employeeCode,
          designation: dto.designation,
          department: dto.department,
          joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
          leavingDate: dto.leavingDate ? new Date(dto.leavingDate) : undefined,
          salary: dto.salary,
          licenseNumber: dto.licenseNumber,
          isPharmacist: dto.isPharmacist,
          isActive: dto.isActive,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        ErrorCode.EMPLOYEE_NOT_FOUND,
        `Employee version conflict or not found: ${id}`,
        id,
      );

      const employee = await tx.employee.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.EMPLOYEE,
        entityId: employee.id,
        entityUuid: employee.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.EMPLOYEE,
        entityUuid: employee.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: employee.uuid, employeeCode: employee.employeeCode },
      });

      return toEmployeeResponse(employee);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.employee.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.EMPLOYEE_NOT_FOUND,
          `Employee not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.employee.updateMany({
        where: { id, version, deletedAt: null },
        data: { deletedAt: new Date(), version: { increment: 1 } },
      });

      optimisticUpdate(
        updateResult,
        ErrorCode.EMPLOYEE_NOT_FOUND,
        `Employee version conflict or not found: ${id}`,
        id,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.EMPLOYEE,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.EMPLOYEE,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }
}
