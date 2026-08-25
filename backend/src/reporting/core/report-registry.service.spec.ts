import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { ReportRegistryService } from './report-registry.service';
import type { ReportDefinition } from './report-definition.interface';

function buildDefinition(id: string): ReportDefinition {
  return {
    id,
    name: `Report ${id}`,
    category: 'test',
    permission: 'REPORT_PARTY_VIEW',
    run: () =>
      Promise.resolve({
        columns: [],
        rows: [],
      }),
  };
}

describe('ReportRegistryService', () => {
  let service: ReportRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportRegistryService],
    }).compile();

    service = module.get(ReportRegistryService);
  });

  it('registers and resolves a report definition', () => {
    const definition = buildDefinition('party.customer-list');
    service.register(definition);

    expect(service.get('party.customer-list')).toBe(definition);
  });

  it('throws CONFLICT when registering duplicate report id', () => {
    service.register(buildDefinition('party.customer-list'));

    try {
      service.register(buildDefinition('party.customer-list'));
      throw new Error('Expected register to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationException);
      expect((error as ApplicationException).code).toBe(ErrorCode.CONFLICT);
    }
  });

  it('throws REPORT_NOT_FOUND for unknown id', () => {
    try {
      service.get('missing.report');
      throw new Error('Expected get to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationException);
      expect((error as ApplicationException).code).toBe(
        ErrorCode.REPORT_NOT_FOUND,
      );
    }
  });

  it('lists metadata without run function', () => {
    service.register(buildDefinition('party.customer-list'));

    expect(service.list()).toEqual([
      {
        id: 'party.customer-list',
        name: 'Report party.customer-list',
        category: 'test',
        permission: 'REPORT_PARTY_VIEW',
      },
    ]);
  });

  it('filters listForUser by permission', () => {
    service.register(buildDefinition('party.customer-list'));
    service.register({
      ...buildDefinition('sales.summary'),
      permission: 'REPORT_SALES_VIEW',
    });

    const visible = service.listForUser(['REPORT_PARTY_VIEW']);

    expect(visible.map((item) => item.id)).toEqual(['party.customer-list']);
  });
});
