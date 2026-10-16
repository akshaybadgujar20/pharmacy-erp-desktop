import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { PurchaseInvoiceDetailComponent } from './purchase-invoice-detail.component';
import { PurchaseInvoiceService } from './purchase-invoice.service';

describe('PurchaseInvoiceDetailComponent', () => {
  let fixture: ComponentFixture<PurchaseInvoiceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseInvoiceDetailComponent],
      providers: [
        {
          provide: PurchaseInvoiceService,
          useValue: {
            getById: jest.fn().mockReturnValue(
              of({
                id: '1',
                version: '1',
                status: 'DRAFT',
                branchId: '1',
                supplierId: '1',
                supplierInvoiceNumber: 'INV-1',
                goodsReceiptId: null,
                invoiceDate: '1',
                dueDate: null,
                remarks: null,
              }),
            ),
            getMatchSummary: jest.fn().mockReturnValue(
              of({
                matchStatus: 'NO_GRN',
                purchaseInvoiceId: '1',
                invoiceLineCount: 0,
                invoiceTotalQty: 0,
                grnLineCount: 0,
                grnTotalQty: 0,
                goodsReceiptId: null,
                purchaseOrderId: null,
              }),
            ),
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
      .overrideComponent(PurchaseInvoiceDetailComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(PurchaseInvoiceDetailComponent);
    fixture.detectChanges();
  });

  it('loads match summary with invoice', () => {
    const service = TestBed.inject(PurchaseInvoiceService);
    expect(service.getMatchSummary).toHaveBeenCalledWith('1');
  });
});
