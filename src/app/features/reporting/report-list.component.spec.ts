import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ReportListComponent } from './report-list.component';
import { ReportService } from './report.service';

@Component({ selector: 'app-grid', standalone: true, template: '' })
class AppGridStubComponent {
  config = input<unknown>();
  data = input<unknown[]>();
  loading = input(false);
}

describe('ReportListComponent', () => {
  let fixture: ComponentFixture<ReportListComponent>;
  let component: ReportListComponent;
  let reportService: jest.Mocked<Pick<ReportService, 'list'>>;
  let router: jest.Mocked<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    reportService = {
      list: jest.fn().mockReturnValue(
        of([
          {
            id: 'party.customer-list',
            name: 'Customer List',
            category: 'party',
            permission: 'REPORT_PARTY_VIEW',
          },
        ]),
      ),
    };
    router = { navigate: jest.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [ReportListComponent],
      providers: [
        { provide: ReportService, useValue: reportService },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(ReportListComponent, {
        set: { imports: [AppGridStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ReportListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads reports on init', () => {
    expect(reportService.list).toHaveBeenCalled();
    expect(component.rows().length).toBe(1);
  });

  it('navigates to report runner on row double click', () => {
    component.onRowDoubleClick({
      row: {
        id: 'party.customer-list',
        name: 'Customer List',
        category: 'party',
        permission: 'REPORT_PARTY_VIEW',
      },
    });
    expect(router.navigate).toHaveBeenCalledWith(['/reports', 'party.customer-list']);
  });
});
