import { Test, TestingModule } from '@nestjs/testing';
import { StockTransferService } from './stock-transfer.service';

describe('StockTransferService', () => {
  let service: StockTransferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockTransferService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(StockTransferService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
