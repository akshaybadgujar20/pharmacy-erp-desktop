import { Test, TestingModule } from '@nestjs/testing';
import { GoodsReceiptItemService } from './goods-receipt-item.service';

describe('GoodsReceiptItemService', () => {
  let service: GoodsReceiptItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoodsReceiptItemService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(GoodsReceiptItemService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
