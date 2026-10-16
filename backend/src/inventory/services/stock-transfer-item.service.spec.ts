import { Test, TestingModule } from '@nestjs/testing';
import { StockTransferItemService } from './stock-transfer-item.service';

describe('StockTransferItemService', () => {
  let service: StockTransferItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockTransferItemService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(StockTransferItemService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
