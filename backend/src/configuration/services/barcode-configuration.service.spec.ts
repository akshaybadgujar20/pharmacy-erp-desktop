import { Test, TestingModule } from '@nestjs/testing';
import { BarcodeConfigurationService } from './barcode-configuration.service';

describe('BarcodeConfigurationService', () => {
  let service: BarcodeConfigurationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BarcodeConfigurationService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(BarcodeConfigurationService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
