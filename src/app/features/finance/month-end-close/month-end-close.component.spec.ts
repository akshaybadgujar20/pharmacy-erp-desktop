import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FinancialYearService } from '../../configuration/financial-years/financial-year.service';
import { ClosingService } from '../closing/closing.service';
import { MonthEndCloseComponent } from './month-end-close.component';

describe('MonthEndCloseComponent', () => {
  let fixture: ComponentFixture<MonthEndCloseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthEndCloseComponent],
      providers: [
        {
          provide: ClosingService,
          useValue: {
            getPreCloseChecklist: jest.fn().mockReturnValue(
              of({ canClose: false, blockers: [] }),
            ),
          },
        },
        {
          provide: FinancialYearService,
          useValue: {
            list: jest.fn().mockReturnValue(
              of({
                data: [
                  {
                    id: '1',
                    version: '1',
                    isCurrent: true,
                    financialYearCode: 'FY25',
                  },
                ],
                pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
              }),
            ),
            close: jest.fn().mockReturnValue(of({ version: '2', financialYearCode: 'FY25' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthEndCloseComponent);
    fixture.detectChanges();
  });

  it('loads pre-close checklist', () => {
    const closing = TestBed.inject(ClosingService);
    fixture.componentInstance.loadChecklist();
    expect(closing.getPreCloseChecklist).toHaveBeenCalled();
  });
});
