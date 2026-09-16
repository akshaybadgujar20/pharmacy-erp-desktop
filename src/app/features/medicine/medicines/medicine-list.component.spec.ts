import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { MedicineListComponent } from './medicine-list.component';
import { MedicineService } from './medicine.service';

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

describe('MedicineListComponent', () => {
  let fixture: ComponentFixture<MedicineListComponent>;
  let component: MedicineListComponent;
  let medicineService: jest.Mocked<Pick<MedicineService, 'list' | 'delete'>>;
  let router: jest.Mocked<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    medicineService = {
      list: jest.fn().mockReturnValue(
        of({
          data: [
            {
              id: '1',
              uuid: 'uuid-1',
              medicineCode: 'M001',
              medicineName: 'Paracetamol 500mg',
              manufacturerId: '10',
              categoryId: '20',
              scheduleId: null,
              unitId: '30',
              brandName: 'Brand A',
              strength: '500mg',
              dosageForm: 'Tablet',
              packSize: '10',
              hsnCode: null,
              barcode: null,
              requiresPrescription: false,
              narcoticDrug: false,
              refrigerated: false,
              discontinued: false,
              isActive: true,
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
      imports: [MedicineListComponent],
      providers: [
        { provide: MedicineService, useValue: medicineService },
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
      .overrideComponent(MedicineListComponent, {
        set: { imports: [AppToolbarStubComponent, AppGridStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MedicineListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads medicines on init', () => {
    expect(medicineService.list).toHaveBeenCalled();
    expect(component.rows().length).toBe(1);
    expect(component.totalRecords()).toBe(1);
  });

  it('navigates to new medicine on create action', () => {
    component.onToolbarAction({ action: 'create', source: 'button' });
    expect(router.navigate).toHaveBeenCalledWith(['/medicine/medicines/new']);
  });
});
