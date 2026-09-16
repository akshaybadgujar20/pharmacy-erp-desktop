import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const salesRoutes: Routes = [
  {
    path: 'invoices',
    canActivate: [permissionGuard('SALES:SALES_INVOICE:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./sales-invoices/sales-invoice-list.component').then(
            (m) => m.SalesInvoiceListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('SALES:SALES_INVOICE:CREATE')],
        loadComponent: () =>
          import('./sales-invoices/sales-invoice-detail.component').then(
            (m) => m.SalesInvoiceDetailComponent,
          ),
      },
      {
        path: ':invoiceId/items',
        loadComponent: () =>
          import('./sales-invoices/sales-invoice-detail.component').then(
            (m) => m.SalesInvoiceDetailComponent,
          ),
      },
      {
        path: ':invoiceId/payments',
        loadComponent: () =>
          import('./sales-invoices/sales-invoice-detail.component').then(
            (m) => m.SalesInvoiceDetailComponent,
          ),
      },
      {
        path: ':invoiceId',
        loadComponent: () =>
          import('./sales-invoices/sales-invoice-detail.component').then(
            (m) => m.SalesInvoiceDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'returns',
    canActivate: [permissionGuard('SALES:SALES_RETURN:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./sales-returns/sales-return-list.component').then(
            (m) => m.SalesReturnListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('SALES:SALES_RETURN:CREATE')],
        loadComponent: () =>
          import('./sales-returns/sales-return-detail.component').then(
            (m) => m.SalesReturnDetailComponent,
          ),
      },
      {
        path: ':returnId/items',
        loadComponent: () =>
          import('./sales-returns/sales-return-detail.component').then(
            (m) => m.SalesReturnDetailComponent,
          ),
      },
      {
        path: ':returnId',
        loadComponent: () =>
          import('./sales-returns/sales-return-detail.component').then(
            (m) => m.SalesReturnDetailComponent,
          ),
      },
    ],
  },
];
