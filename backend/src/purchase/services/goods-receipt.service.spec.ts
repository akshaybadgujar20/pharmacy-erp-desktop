import { Test, TestingModule } from '@nestjs/testing';
import { GoodsReceiptService } from './goods-receipt.service';

describe('GoodsReceiptService', () => {
  let service: GoodsReceiptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoodsReceiptService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(GoodsReceiptService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
