import { Test, TestingModule } from '@nestjs/testing';
import { MedicineScheduleService } from './medicine-schedule.service';

describe('MedicineScheduleService', () => {
  let service: MedicineScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicineScheduleService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(MedicineScheduleService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
