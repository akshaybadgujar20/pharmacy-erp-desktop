import { Test, TestingModule } from '@nestjs/testing';
import { StockTakeItemService } from './stock-take-item.service';

describe('StockTakeItemService', () => {
  let service: StockTakeItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockTakeItemService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(StockTakeItemService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
