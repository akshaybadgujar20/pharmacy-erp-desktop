import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { CustomerListComponent } from './customer-list.component';
import { CustomerService } from './customer.service';

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

describe('CustomerListComponent', () => {
  let fixture: ComponentFixture<CustomerListComponent>;
  let component: CustomerListComponent;
  let customerService: jest.Mocked<Pick<CustomerService, 'list' | 'delete'>>;
  let router: jest.Mocked<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    customerService = {
      list: jest.fn().mockReturnValue(
        of({
          data: [
            {
              id: '1',
              partyId: '10',
              uuid: 'uuid-1',
              customerCode: 'C001',
              customerType: 'RETAIL',
              creditLimit: 1000,
              outstandingAmount: 0,
              paymentTermsDays: 30,
              loyaltyPoints: 0,
              isTaxExempt: false,
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
      imports: [CustomerListComponent],
      providers: [
        { provide: CustomerService, useValue: customerService },
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
      .overrideComponent(CustomerListComponent, {
        set: { imports: [AppToolbarStubComponent, AppGridStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CustomerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads customers on init', () => {
    expect(customerService.list).toHaveBeenCalled();
    expect(component.rows().length).toBe(1);
    expect(component.totalRecords()).toBe(1);
  });

  it('navigates to new customer on create action', () => {
    component.onToolbarAction({ action: 'create', source: 'button' });
    expect(router.navigate).toHaveBeenCalledWith(['/party/customers/new']);
  });
});
