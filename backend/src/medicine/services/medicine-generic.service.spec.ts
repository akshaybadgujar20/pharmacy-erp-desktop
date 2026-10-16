import { Test, TestingModule } from '@nestjs/testing';
import { MedicineGenericService } from './medicine-generic.service';

describe('MedicineGenericService', () => {
  let service: MedicineGenericService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicineGenericService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(MedicineGenericService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
