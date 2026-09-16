import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { DiscountRuleListComponent } from './discount-rule-list.component';
import { DiscountRuleService } from './discount-rule.service';

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

describe('DiscountRuleListComponent', () => {
  let fixture: ComponentFixture<DiscountRuleListComponent>;
  let component: DiscountRuleListComponent;
  let discountRuleService: jest.Mocked<Pick<DiscountRuleService, 'list' | 'delete'>>;
  let router: jest.Mocked<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    discountRuleService = {
      list: jest.fn().mockReturnValue(
        of({
          data: [
            {
              id: '1',
              uuid: 'uuid-1',
              ruleCode: 'DR001',
              ruleName: 'Default Discount',
              discountType: 'PERCENT',
              discountValue: '10',
              appliesTo: 'GLOBAL',
              medicineId: null,
              categoryId: null,
              customerId: null,
              priceListId: null,
              minimumQuantity: null,
              minimumAmount: null,
              priority: 1,
              effectiveFrom: '2026-01-01T00:00:00.000Z',
              effectiveTo: null,
              isActive: true,
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
      imports: [DiscountRuleListComponent],
      providers: [
        { provide: DiscountRuleService, useValue: discountRuleService },
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
      .overrideComponent(DiscountRuleListComponent, {
        set: { imports: [AppToolbarStubComponent, AppGridStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DiscountRuleListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads discount rules on init', () => {
    expect(discountRuleService.list).toHaveBeenCalled();
    expect(component.rows().length).toBe(1);
    expect(component.totalRecords()).toBe(1);
  });

  it('navigates to new discount rule on create action', () => {
    component.onToolbarAction({ action: 'create', source: 'button' });
    expect(router.navigate).toHaveBeenCalledWith(['/pricing/discount-rules/new']);
  });
});
