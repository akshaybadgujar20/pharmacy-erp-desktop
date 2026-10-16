import { Test, TestingModule } from '@nestjs/testing';
import { SequenceGeneratorService } from './sequence-generator.service';

describe('SequenceGeneratorService', () => {
  let service: SequenceGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SequenceGeneratorService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(SequenceGeneratorService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
