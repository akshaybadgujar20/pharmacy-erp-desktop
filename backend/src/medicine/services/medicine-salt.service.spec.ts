import { Test, TestingModule } from '@nestjs/testing';
import { MedicineSaltService } from './medicine-salt.service';

describe('MedicineSaltService', () => {
  let service: MedicineSaltService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicineSaltService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(MedicineSaltService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
