import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../common/exceptions/error-code';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { PrismaService } from '../../prisma.service';
import { ChangeHistoryService } from './change-history.service';

describe('ChangeHistoryService', () => {
  let service: ChangeHistoryService;
  let prisma: {
    changeHistory: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
  };
  let requestContext: { get: jest.Mock };

  beforeEach(async () => {
    prisma = {
      changeHistory: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    requestContext = {
      get: jest.fn().mockReturnValue({ companyId: 1n, branchId: 2n }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeHistoryService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: RequestContextService, useValue: requestContext },
      ],
    }).compile();

    service = module.get(ChangeHistoryService);
  });

  it('list scopes results to the JWT branch via auditLog relation', async () => {
    await service.list({ page: 1, pageSize: 20 });

    const callArgs = prisma.changeHistory.count.mock.calls as Array<
      [Prisma.ChangeHistoryCountArgs]
    >;
    const args = callArgs[0][0];

    expect(args.where).toMatchObject({
      auditLog: { branchId: 2n },
    });
  });

  it('getById returns not found when row is outside branch scope', async () => {
    await expect(service.getById(99n)).rejects.toMatchObject({
      code: ErrorCode.CHANGE_HISTORY_NOT_FOUND,
    });

    expect(prisma.changeHistory.findFirst).toHaveBeenCalledWith({
      where: { id: 99n, auditLog: { branchId: 2n } },
      include: { auditLog: true },
    });
  });
});
