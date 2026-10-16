import { Test, TestingModule } from '@nestjs/testing';
import { DoctorService } from './doctor.service';

describe('DoctorService', () => {
  let service: DoctorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DoctorService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(DoctorService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
