import { Test, TestingModule } from '@nestjs/testing';
import { StockTakeService } from './stock-take.service';

describe('StockTakeService', () => {
  let service: StockTakeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockTakeService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(StockTakeService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
