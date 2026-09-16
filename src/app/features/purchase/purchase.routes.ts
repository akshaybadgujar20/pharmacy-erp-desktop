import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const purchaseRoutes: Routes = [
  {
    path: 'orders',
    canActivate: [permissionGuard('PURCHASE:PURCHASE_ORDER:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./purchase-orders/purchase-order-list.component').then(
            (m) => m.PurchaseOrderListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('PURCHASE:PURCHASE_ORDER:CREATE')],
        loadComponent: () =>
          import('./purchase-orders/purchase-order-detail.component').then(
            (m) => m.PurchaseOrderDetailComponent,
          ),
      },
      {
        path: ':orderId/items',
        loadComponent: () =>
          import('./purchase-orders/purchase-order-detail.component').then(
            (m) => m.PurchaseOrderDetailComponent,
          ),
      },
      {
        path: ':orderId',
        loadComponent: () =>
          import('./purchase-orders/purchase-order-detail.component').then(
            (m) => m.PurchaseOrderDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'invoices',
    canActivate: [permissionGuard('PURCHASE:PURCHASE_INVOICE:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./purchase-invoices/purchase-invoice-list.component').then(
            (m) => m.PurchaseInvoiceListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('PURCHASE:PURCHASE_INVOICE:CREATE')],
        loadComponent: () =>
          import('./purchase-invoices/purchase-invoice-detail.component').then(
            (m) => m.PurchaseInvoiceDetailComponent,
          ),
      },
      {
        path: ':invoiceId/items',
        loadComponent: () =>
          import('./purchase-invoices/purchase-invoice-detail.component').then(
            (m) => m.PurchaseInvoiceDetailComponent,
          ),
      },
      {
        path: ':invoiceId',
        loadComponent: () =>
          import('./purchase-invoices/purchase-invoice-detail.component').then(
            (m) => m.PurchaseInvoiceDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'returns',
    canActivate: [permissionGuard('PURCHASE:PURCHASE_RETURN:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./purchase-returns/purchase-return-list.component').then(
            (m) => m.PurchaseReturnListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('PURCHASE:PURCHASE_RETURN:CREATE')],
        loadComponent: () =>
          import('./purchase-returns/purchase-return-detail.component').then(
            (m) => m.PurchaseReturnDetailComponent,
          ),
      },
      {
        path: ':returnId/items',
        loadComponent: () =>
          import('./purchase-returns/purchase-return-detail.component').then(
            (m) => m.PurchaseReturnDetailComponent,
          ),
      },
      {
        path: ':returnId',
        loadComponent: () =>
          import('./purchase-returns/purchase-return-detail.component').then(
            (m) => m.PurchaseReturnDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'goods-receipts',
    canActivate: [permissionGuard('PURCHASE:GOODS_RECEIPT:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./goods-receipts/goods-receipt-list.component').then(
            (m) => m.GoodsReceiptListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('PURCHASE:GOODS_RECEIPT:CREATE')],
        loadComponent: () =>
          import('./goods-receipts/goods-receipt-detail.component').then(
            (m) => m.GoodsReceiptDetailComponent,
          ),
      },
      {
        path: ':goodsReceiptId/items',
        loadComponent: () =>
          import('./goods-receipts/goods-receipt-detail.component').then(
            (m) => m.GoodsReceiptDetailComponent,
          ),
      },
      {
        path: ':goodsReceiptId',
        loadComponent: () =>
          import('./goods-receipts/goods-receipt-detail.component').then(
            (m) => m.GoodsReceiptDetailComponent,
          ),
      },
    ],
  },
];
