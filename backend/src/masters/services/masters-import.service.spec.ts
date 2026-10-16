import { Test, TestingModule } from '@nestjs/testing';
import { MastersImportService } from './masters-import.service';

describe('MastersImportService', () => {
  let service: MastersImportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MastersImportService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(MastersImportService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
