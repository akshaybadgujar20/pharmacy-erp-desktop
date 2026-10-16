import { Test, TestingModule } from '@nestjs/testing';
import { PriceListItemService } from './price-list-item.service';

describe('PriceListItemService', () => {
  let service: PriceListItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PriceListItemService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PriceListItemService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
