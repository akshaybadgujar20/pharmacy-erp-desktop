import { Test, TestingModule } from '@nestjs/testing';
import { PartyContactService } from './party-contact.service';

describe('PartyContactService', () => {
  let service: PartyContactService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PartyContactService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PartyContactService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
