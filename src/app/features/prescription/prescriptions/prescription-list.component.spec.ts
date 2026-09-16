import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { PrescriptionListComponent } from './prescription-list.component';
import { PrescriptionService } from './prescription.service';

@Component({ selector: 'app-toolbar', standalone: true, template: '' })
class AppToolbarStubComponent {
  config = input<unknown>();
  action = output<ToolbarActionEvent>();
}

@Component({ selector: 'app-grid', standalone: true, template: '' })
class AppGridStubComponent {
  config = input<unknown>();
  data = input<unknown[]>();
  loading = input(false);
  totalRecords = input<number>();
}

describe('PrescriptionListComponent', () => {
  let fixture: ComponentFixture<PrescriptionListComponent>;
  let component: PrescriptionListComponent;
  let prescriptionService: jest.Mocked<Pick<PrescriptionService, 'list' | 'delete'>>;
  let router: jest.Mocked<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    prescriptionService = {
      list: jest.fn().mockReturnValue(
        of({
          data: [
            {
              id: '1',
              uuid: 'uuid-1',
              prescriptionNumber: 'RX001',
              customerId: '10',
              doctorId: '20',
              branchId: '1',
              prescriptionDate: '2026-01-01T00:00:00.000Z',
              validUntil: null,
              diagnosis: null,
              symptoms: null,
              visitNumber: null,
              status: 'DRAFT',
              remarks: null,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
              deletedAt: null,
              version: 1,
            },
          ],
          pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
        }),
      ),
      delete: jest.fn().mockReturnValue(of(undefined)),
    };
    router = { navigate: jest.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [PrescriptionListComponent],
      providers: [
        { provide: PrescriptionService, useValue: prescriptionService },
        { provide: Router, useValue: router },
        {
          provide: KeyboardShortcutService,
          useValue: {
            registerHandler: jest.fn(),
            unregisterHandler: jest.fn(),
          },
        },
      ],
    })
      .overrideComponent(PrescriptionListComponent, {
        set: { imports: [AppToolbarStubComponent, AppGridStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PrescriptionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads prescriptions on init', () => {
    expect(prescriptionService.list).toHaveBeenCalled();
    expect(component.rows().length).toBe(1);
    expect(component.totalRecords()).toBe(1);
  });

  it('navigates to new prescription on create action', () => {
    component.onToolbarAction({ action: 'create', source: 'button' });
    expect(router.navigate).toHaveBeenCalledWith(['/prescriptions/new']);
  });
});
