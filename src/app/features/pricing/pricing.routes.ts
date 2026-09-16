import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const pricingRoutes: Routes = [
  {
    path: 'discount-rules',
    canActivate: [permissionGuard('PRICING:DISCOUNT_RULE:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./discount-rules/discount-rule-list.component').then(
            (m) => m.DiscountRuleListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('PRICING:DISCOUNT_RULE:CREATE')],
        loadComponent: () =>
          import('./discount-rules/discount-rule-detail.component').then(
            (m) => m.DiscountRuleDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./discount-rules/discount-rule-detail.component').then(
            (m) => m.DiscountRuleDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'price-lists',
    canActivate: [permissionGuard('PRICING:PRICE_LIST:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./price-lists/price-list-list.component').then(
            (m) => m.PriceListListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('PRICING:PRICE_LIST:CREATE')],
        loadComponent: () =>
          import('./price-lists/price-list-detail.component').then(
            (m) => m.PriceListDetailComponent,
          ),
      },
      {
        path: ':priceListId/items',
        loadComponent: () =>
          import('./price-lists/price-list-detail.component').then(
            (m) => m.PriceListDetailComponent,
          ),
      },
      {
        path: ':priceListId',
        loadComponent: () =>
          import('./price-lists/price-list-detail.component').then(
            (m) => m.PriceListDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'taxes',
    canActivate: [permissionGuard('PRICING:TAX:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./taxes/tax-list.component').then((m) => m.TaxListComponent),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('PRICING:TAX:CREATE')],
        loadComponent: () =>
          import('./taxes/tax-detail.component').then((m) => m.TaxDetailComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./taxes/tax-detail.component').then((m) => m.TaxDetailComponent),
      },
    ],
  },
];
