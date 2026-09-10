import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { PriceListService } from './price-list.service';

describe('PriceListService', () => {
  let service: PriceListService;
  let prisma: {
    priceList: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let requestContext: { get: jest.Mock };

  beforeEach(async () => {
    prisma = {
      priceList: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    requestContext = {
      get: jest.fn().mockReturnValue({ companyId: 1n, branchId: 2n }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceListService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: UnitOfWorkService, useValue: { run: jest.fn() } },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: OutboxService, useValue: { enqueue: jest.fn() } },
        { provide: RequestContextService, useValue: requestContext },
      ],
    }).compile();

    service = module.get(PriceListService);
  });

  it('combines branch filter and search with AND so search cannot bypass branch scope', async () => {
    await service.list({ search: 'retail', page: 1, pageSize: 20 });

    const callArgs = prisma.priceList.count.mock.calls as Array<
      [Prisma.PriceListCountArgs]
    >;
    const args = callArgs[0][0];

    expect(args.where).toMatchObject({
      deletedAt: null,
      AND: [
        { OR: [{ branchId: 2n }, { branchId: null }] },
        {
          OR: [
            { priceListCode: { contains: 'retail' } },
            { priceListName: { contains: 'retail' } },
          ],
        },
      ],
    });
  });
});
