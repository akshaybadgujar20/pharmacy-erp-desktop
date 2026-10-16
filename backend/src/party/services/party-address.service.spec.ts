import { Test, TestingModule } from '@nestjs/testing';
import { PartyAddressService } from './party-address.service';

describe('PartyAddressService', () => {
  let service: PartyAddressService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PartyAddressService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PartyAddressService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
