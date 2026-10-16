import { Test, TestingModule } from '@nestjs/testing';
import { PrescriptionService } from './prescription.service';

describe('PrescriptionService', () => {
  let service: PrescriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrescriptionService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PrescriptionService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
