import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ElectronService } from '../../../core/services/electron.service';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { MedicineService } from '../../medicine/medicines/medicine.service';
import { PrinterConfigurationService } from '../../configuration/printer-configurations/printer-configuration.service';
import { CustomerLoyaltySummaryService } from './customer-loyalty-summary.service';
import { SalesInvoiceCounterComponent } from './sales-invoice-counter.component';
import { SalesInvoiceService } from './sales-invoice.service';

describe('SalesInvoiceCounterComponent', () => {
  let fixture: ComponentFixture<SalesInvoiceCounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesInvoiceCounterComponent],
      providers: [
        {
          provide: SalesInvoiceService,
          useValue: {
            getById: jest.fn().mockReturnValue(
              of({
                id: '1',
                version: '1',
                status: 'DRAFT',
                branchId: '1',
                customerId: null,
                invoiceDate: '1',
                remarks: null,
              }),
            ),
          },
        },
        { provide: MedicineService, useValue: { findByBarcode: jest.fn() } },
        {
          provide: PrinterConfigurationService,
          useValue: { list: jest.fn().mockReturnValue(of({ data: [] })) },
        },
        {
          provide: CustomerLoyaltySummaryService,
          useValue: { getSummary: jest.fn().mockReturnValue(of(null)) },
        },
        {
          provide: ActiveScreenSaveService,
          useValue: { register: jest.fn(), unregister: jest.fn() },
        },
        {
          provide: KeyboardShortcutService,
          useValue: {
            registerHandler: jest.fn(),
            unregisterHandler: jest.fn(),
          },
        },
        {
          provide: ElectronService,
          useValue: {
            isElectron: false,
            onBarcodeScan: jest.fn(() => () => undefined),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'invoiceId' ? '1' : null),
              },
              url: [],
            },
          },
        },
        { provide: Router, useValue: { navigate: jest.fn() } },
      ],
    })
      .overrideComponent(SalesInvoiceCounterComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SalesInvoiceCounterComponent);
    fixture.detectChanges();
  });

  it('creates counter screen', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
