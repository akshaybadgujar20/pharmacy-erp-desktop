import { Test, TestingModule } from '@nestjs/testing';
import { PriceListService } from './price-list.service';

describe('PriceListService', () => {
  let service: PriceListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PriceListService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PriceListService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
