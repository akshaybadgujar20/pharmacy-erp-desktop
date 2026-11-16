import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const loyaltyRoutes: Routes = [
  {
    path: 'programs',
    canActivate: [permissionGuard('LOYALTY:LOYALTY_PROGRAM:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./loyalty-program-list.component').then(
            (m) => m.LoyaltyProgramListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('LOYALTY:LOYALTY_PROGRAM:CREATE')],
        loadComponent: () =>
          import('./loyalty-program-detail.component').then(
            (m) => m.LoyaltyProgramDetailComponent,
          ),
      },
      {
        path: ':programId',
        loadComponent: () =>
          import('./loyalty-program-detail.component').then(
            (m) => m.LoyaltyProgramDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'customers/:customerId/transactions',
    canActivate: [permissionGuard('LOYALTY:LOYALTY_PROGRAM:READ')],
    loadComponent: () =>
      import('./customer-loyalty-transactions.component').then(
        (m) => m.CustomerLoyaltyTransactionsComponent,
      ),
  },
];
