import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ApplicationException } from '../common/exceptions/application.exception';
import { ErrorCode } from '../common/exceptions/error-code';
import { RequestContextService } from '../persistence/context/request-context.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportFavoriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  async listForCurrentUser() {
    const userId = this.requestContext.get().userId;
    if (!userId) {
      throw new ApplicationException(
        ErrorCode.UNAUTHORIZED,
        'User context required',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const rows = await this.prisma.client.reportFavorite.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { reportCode: 'asc' }],
    });
    return rows.map((row) => ({
      id: row.id.toString(),
      reportCode: row.reportCode,
      sortOrder: row.sortOrder,
      version: row.version.toString(),
    }));
  }

  async add(reportCode: string) {
    const userId = this.requestContext.get().userId;
    if (!userId) {
      throw new ApplicationException(
        ErrorCode.UNAUTHORIZED,
        'User context required',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const now = BigInt(Date.now());
    const existing = await this.prisma.client.reportFavorite.findFirst({
      where: { userId, reportCode, deletedAt: null },
    });
    if (existing) {
      return {
        id: existing.id.toString(),
        reportCode: existing.reportCode,
        sortOrder: existing.sortOrder,
        version: existing.version.toString(),
      };
    }

    const created = await this.prisma.client.reportFavorite.create({
      data: {
        uuid: randomUUID(),
        userId,
        reportCode,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
    });
    return {
      id: created.id.toString(),
      reportCode: created.reportCode,
      sortOrder: created.sortOrder,
      version: created.version.toString(),
    };
  }

  async remove(id: bigint, version: bigint) {
    const userId = this.requestContext.get().userId;
    if (!userId) {
      throw new ApplicationException(
        ErrorCode.UNAUTHORIZED,
        'User context required',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const row = await this.prisma.client.reportFavorite.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!row) {
      throw new ApplicationException(
        ErrorCode.NOT_FOUND,
        'Report favorite not found',
        HttpStatus.NOT_FOUND,
        { id: id.toString() },
      );
    }

    const now = BigInt(Date.now());
    const updated = await this.prisma.client.reportFavorite.updateMany({
      where: { id, version, deletedAt: null },
      data: { deletedAt: now, updatedAt: now, version: { increment: 1 } },
    });
    if (updated.count !== 1) {
      throw new ApplicationException(
        ErrorCode.ENTITY_VERSION_CONFLICT,
        'Report favorite version conflict',
        HttpStatus.CONFLICT,
        { id: id.toString() },
      );
    }
    return { id: id.toString(), deleted: true };
  }
}
