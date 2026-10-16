import { Test, TestingModule } from '@nestjs/testing';
import { SalesReturnItemService } from './sales-return-item.service';

describe('SalesReturnItemService', () => {
  let service: SalesReturnItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesReturnItemService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(SalesReturnItemService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
