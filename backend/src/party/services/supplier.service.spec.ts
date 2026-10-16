import { Test, TestingModule } from '@nestjs/testing';
import { SupplierService } from './supplier.service';

describe('SupplierService', () => {
  let service: SupplierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(SupplierService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
