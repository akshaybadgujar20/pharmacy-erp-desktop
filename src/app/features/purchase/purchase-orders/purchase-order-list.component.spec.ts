import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { PurchaseOrderListComponent } from './purchase-order-list.component';
import { PurchaseOrderService } from './purchase-order.service';

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

describe('PurchaseOrderListComponent', () => {
  let fixture: ComponentFixture<PurchaseOrderListComponent>;
  let component: PurchaseOrderListComponent;
  let purchaseOrderService: jest.Mocked<Pick<PurchaseOrderService, 'list' | 'delete'>>;
  let router: jest.Mocked<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    purchaseOrderService = {
      list: jest.fn().mockReturnValue(
        of({
          data: [
            {
              id: '1',
              uuid: 'uuid-1',
              purchaseOrderNumber: 'PO-001',
              supplierId: '10',
              branchId: '1',
              orderDate: '1700000000000',
              expectedDeliveryDate: null,
              grossAmount: 100,
              discountAmount: 0,
              taxAmount: 0,
              netAmount: 100,
              status: 'DRAFT',
              remarks: null,
              approvedByEmployeeId: null,
              approvedAt: null,
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
      imports: [PurchaseOrderListComponent],
      providers: [
        { provide: PurchaseOrderService, useValue: purchaseOrderService },
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
      .overrideComponent(PurchaseOrderListComponent, {
        set: { imports: [AppToolbarStubComponent, AppGridStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PurchaseOrderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads purchase orders on init', () => {
    expect(purchaseOrderService.list).toHaveBeenCalled();
    expect(component.rows().length).toBe(1);
    expect(component.totalRecords()).toBe(1);
  });

  it('navigates to new purchase order on create action', () => {
    component.onToolbarAction({ action: 'create', source: 'button' });
    expect(router.navigate).toHaveBeenCalledWith(['/purchase/orders/new']);
  });
});
