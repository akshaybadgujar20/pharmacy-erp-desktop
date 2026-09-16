import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { SalesInvoiceListComponent } from './sales-invoice-list.component';
import { SalesInvoiceService } from './sales-invoice.service';

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

describe('SalesInvoiceListComponent', () => {
  let fixture: ComponentFixture<SalesInvoiceListComponent>;
  let component: SalesInvoiceListComponent;
  let salesInvoiceService: jest.Mocked<Pick<SalesInvoiceService, 'list' | 'delete'>>;
  let router: jest.Mocked<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    salesInvoiceService = {
      list: jest.fn().mockReturnValue(
        of({
          data: [
            {
              id: '1',
              uuid: 'uuid-1',
              invoiceNumber: 'SI-001',
              customerId: '10',
              prescriptionId: null,
              branchId: '1',
              invoiceDate: '1700000000000',
              patientName: null,
              doctorName: null,
              grossAmount: 100,
              discountAmount: 0,
              taxAmount: 0,
              roundOffAmount: 0,
              netAmount: 100,
              paidAmount: 0,
              balanceAmount: 100,
              paymentMode: null,
              paymentStatus: 'UNPAID',
              status: 'DRAFT',
              salesType: 'RETAIL_OTC',
              remarks: null,
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
      imports: [SalesInvoiceListComponent],
      providers: [
        { provide: SalesInvoiceService, useValue: salesInvoiceService },
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
      .overrideComponent(SalesInvoiceListComponent, {
        set: { imports: [AppToolbarStubComponent, AppGridStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SalesInvoiceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads sales invoices on init', () => {
    expect(salesInvoiceService.list).toHaveBeenCalled();
    expect(component.rows().length).toBe(1);
    expect(component.totalRecords()).toBe(1);
  });

  it('navigates to new invoice on create action', () => {
    component.onToolbarAction({ action: 'create', source: 'button' });
    expect(router.navigate).toHaveBeenCalledWith(['/sales/invoices/new']);
  });
});
