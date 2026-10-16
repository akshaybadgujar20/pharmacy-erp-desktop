import { Test, TestingModule } from '@nestjs/testing';
import { StockAdjustmentService } from './stock-adjustment.service';

describe('StockAdjustmentService', () => {
  let service: StockAdjustmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockAdjustmentService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(StockAdjustmentService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
