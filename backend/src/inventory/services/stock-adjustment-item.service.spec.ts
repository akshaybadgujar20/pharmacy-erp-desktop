import { Test, TestingModule } from '@nestjs/testing';
import { StockAdjustmentItemService } from './stock-adjustment-item.service';

describe('StockAdjustmentItemService', () => {
  let service: StockAdjustmentItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockAdjustmentItemService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(StockAdjustmentItemService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
