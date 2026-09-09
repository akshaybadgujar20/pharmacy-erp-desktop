import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { LogoutReason } from '../constants/security.constants';
import { UserSessionListQueryDto } from '../dto/user-session-list-query.dto';
import { toUserSessionResponse } from '../mappers/user-session.mapper';
import { throwNotFound } from '../utils/security.util';

@Injectable()
export class UserSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: UserSessionListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.UserSessionWhereInput = {
      deletedAt: null,
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(search
        ? {
            OR: [
              { deviceName: { contains: search } },
              { ipAddress: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.userSession.count({ where }),
      this.prisma.client.userSession.findMany({
        where,
        orderBy: { loginTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toUserSessionResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const session = await this.prisma.client.userSession.findFirst({
      where: { id, deletedAt: null },
    });

    if (!session) {
      throwNotFound(
        ErrorCode.USER_SESSION_NOT_FOUND,
        `User session not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toUserSessionResponse(session);
  }

  async forceLogout(id: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.userSession.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.USER_SESSION_NOT_FOUND,
          `User session not found: ${id}`,
          { id: id.toString() },
        );
      }

      const now = BigInt(Date.now());
      const session = await tx.userSession.update({
        where: { id },
        data: {
          isActive: false,
          logoutTime: now,
          logoutReason: LogoutReason.FORCE_LOGOUT,
          updatedAt: now,
          version: { increment: 1 },
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.USER_SESSION,
        entityId: session.id,
        entityUuid: session.uuid,
        action: AuditAction.LOGOUT,
        module: AuditModule.SECURITY,
        description: `Force logout session ${session.uuid}`,
        userId: session.userId,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.USER_SESSION,
        entityUuid: session.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: session.uuid, isActive: false },
      });

      return toUserSessionResponse(session);
    });
  }
}
