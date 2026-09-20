import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma.service';
import { ClosingService } from './closing.service';

describe('ClosingService', () => {
  let service: ClosingService;
  let prisma: {
    purchaseOrder: { count: jest.Mock };
    salesInvoice: { count: jest.Mock };
    purchaseInvoice: { count: jest.Mock };
    stockTransfer: { count: jest.Mock };
    stockTake: { count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      purchaseOrder: { count: jest.fn().mockResolvedValue(0) },
      salesInvoice: { count: jest.fn().mockResolvedValue(0) },
      purchaseInvoice: { count: jest.fn().mockResolvedValue(0) },
      stockTransfer: { count: jest.fn().mockResolvedValue(0) },
      stockTake: { count: jest.fn().mockResolvedValue(0) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClosingService,
        { provide: PrismaService, useValue: { client: prisma } },
      ],
    }).compile();

    service = module.get(ClosingService);
  });

  it('returns canClose true when no blockers exist', async () => {
    const result = await service.getPreCloseChecklist(1n);

    expect(result.canClose).toBe(true);
    expect(result.blockers).toEqual([]);
  });

  it('returns blockers when open purchase orders exist', async () => {
    prisma.purchaseOrder.count.mockResolvedValue(2);

    const result = await service.getPreCloseChecklist(1n);

    expect(result.canClose).toBe(false);
    expect(result.blockers).toEqual([
      expect.objectContaining({ code: 'OPEN_PURCHASE_ORDERS', count: 2 }),
    ]);
  });
});
