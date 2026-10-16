import { Test, TestingModule } from '@nestjs/testing';
import { MedicineService } from './medicine.service';

describe('MedicineService', () => {
  let service: MedicineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicineService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(MedicineService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
