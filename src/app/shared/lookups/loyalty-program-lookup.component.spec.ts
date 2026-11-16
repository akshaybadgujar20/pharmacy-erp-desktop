import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoyaltyProgramService } from '../../features/loyalty/loyalty-program.service';
import { LoyaltyProgramLookupComponent } from './loyalty-program-lookup.component';
import { provideTranslateService } from '@ngx-translate/core';

describe('LoyaltyProgramLookupComponent', () => {
  let fixture: ComponentFixture<LoyaltyProgramLookupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoyaltyProgramLookupComponent],
      providers: [
        provideTranslateService(),
        {
          provide: LoyaltyProgramService,
          useValue: {
            list: jest.fn(() =>
              of({
                data: [{ id: '1', programCode: 'LP-1', programName: 'Retail', isActive: true, isDefault: false }],
                pagination: { total: 1, page: 1, pageSize: 20 },
              }),
            ),
            getById: jest.fn(() =>
              of({
                id: '1',
                programCode: 'LP-1',
                programName: 'Retail',
                pointsPerAmount: '1',
                redemptionValue: '1',
                minimumRedemptionPoints: 1,
                effectiveFrom: '',
                isDefault: false,
                isActive: true,
                version: '1',
              }),
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoyaltyProgramLookupComponent);
    fixture.detectChanges();
  });

  it('searches programs', () => {
    const service = TestBed.inject(LoyaltyProgramService);
    fixture.componentInstance.search('LP');
    expect(service.list).toHaveBeenCalled();
  });
});