import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';

describe('StockService', () => {
  let service: StockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(StockService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
