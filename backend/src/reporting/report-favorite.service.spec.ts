import { Test, TestingModule } from '@nestjs/testing';
import { ReportFavoriteService } from './report-favorite.service';

describe('ReportFavoriteService', () => {
  let service: ReportFavoriteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportFavoriteService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(ReportFavoriteService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
