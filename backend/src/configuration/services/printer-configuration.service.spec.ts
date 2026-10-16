import { Test, TestingModule } from '@nestjs/testing';
import { PrinterConfigurationService } from './printer-configuration.service';

describe('PrinterConfigurationService', () => {
  let service: PrinterConfigurationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrinterConfigurationService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PrinterConfigurationService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
