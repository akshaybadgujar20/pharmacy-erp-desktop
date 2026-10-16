import { Test, TestingModule } from '@nestjs/testing';
import { StockMovementService } from './stock-movement.service';

describe('StockMovementService', () => {
  let service: StockMovementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockMovementService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(StockMovementService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
