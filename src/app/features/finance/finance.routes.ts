import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const financeRoutes: Routes = [
  {
    path: 'ledgers',
    canActivate: [permissionGuard('FINANCE:LEDGER:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./ledgers/ledger-list.component').then((m) => m.LedgerListComponent),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('FINANCE:LEDGER:CREATE')],
        loadComponent: () =>
          import('./ledgers/ledger-detail.component').then((m) => m.LedgerDetailComponent),
      },
      {
        path: ':ledgerId/entries',
        loadComponent: () =>
          import('./ledgers/ledger-detail.component').then((m) => m.LedgerDetailComponent),
      },
      {
        path: ':ledgerId',
        loadComponent: () =>
          import('./ledgers/ledger-detail.component').then((m) => m.LedgerDetailComponent),
      },
    ],
  },
  {
    path: 'payments',
    canActivate: [permissionGuard('FINANCE:PAYMENT:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./payments/payment-list.component').then((m) => m.PaymentListComponent),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('FINANCE:PAYMENT:CREATE')],
        loadComponent: () =>
          import('./payments/payment-detail.component').then((m) => m.PaymentDetailComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./payments/payment-detail.component').then((m) => m.PaymentDetailComponent),
      },
    ],
  },
  {
    path: 'receipts',
    canActivate: [permissionGuard('FINANCE:RECEIPT:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./receipts/receipt-list.component').then((m) => m.ReceiptListComponent),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('FINANCE:RECEIPT:CREATE')],
        loadComponent: () =>
          import('./receipts/receipt-detail.component').then((m) => m.ReceiptDetailComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./receipts/receipt-detail.component').then((m) => m.ReceiptDetailComponent),
      },
    ],
  },
];
