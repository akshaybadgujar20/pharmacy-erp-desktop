import { Test, TestingModule } from '@nestjs/testing';
import { SequenceGeneratorConfigService } from './sequence-generator-config.service';

describe('SequenceGeneratorConfigService', () => {
  let service: SequenceGeneratorConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SequenceGeneratorConfigService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(SequenceGeneratorConfigService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
