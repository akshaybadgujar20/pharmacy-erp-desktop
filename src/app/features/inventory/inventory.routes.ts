import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const inventoryRoutes: Routes = [
  {
    path: 'batches',
    canActivate: [permissionGuard('INVENTORY:BATCH:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./batches/batch-list.component').then((m) => m.BatchListComponent),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('INVENTORY:BATCH:CREATE')],
        loadComponent: () =>
          import('./batches/batch-detail.component').then((m) => m.BatchDetailComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./batches/batch-detail.component').then((m) => m.BatchDetailComponent),
      },
    ],
  },
  {
    path: 'stocks',
    canActivate: [permissionGuard('INVENTORY:STOCK:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./stocks/stock-list.component').then((m) => m.StockListComponent),
      },
    ],
  },
  {
    path: 'stock-movements',
    canActivate: [permissionGuard('INVENTORY:STOCK_MOVEMENT:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./stock-movements/stock-movement-list.component').then(
            (m) => m.StockMovementListComponent,
          ),
      },
    ],
  },
  {
    path: 'stock-adjustments',
    canActivate: [permissionGuard('INVENTORY:STOCK_ADJUSTMENT:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./stock-adjustments/stock-adjustment-list.component').then(
            (m) => m.StockAdjustmentListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('INVENTORY:STOCK_ADJUSTMENT:CREATE')],
        loadComponent: () =>
          import('./stock-adjustments/stock-adjustment-detail.component').then(
            (m) => m.StockAdjustmentDetailComponent,
          ),
      },
      {
        path: ':adjustmentId/items',
        loadComponent: () =>
          import('./stock-adjustments/stock-adjustment-detail.component').then(
            (m) => m.StockAdjustmentDetailComponent,
          ),
      },
      {
        path: ':adjustmentId',
        loadComponent: () =>
          import('./stock-adjustments/stock-adjustment-detail.component').then(
            (m) => m.StockAdjustmentDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'stock-transfers',
    canActivate: [permissionGuard('INVENTORY:STOCK_TRANSFER:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./stock-transfers/stock-transfer-list.component').then(
            (m) => m.StockTransferListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('INVENTORY:STOCK_TRANSFER:CREATE')],
        loadComponent: () =>
          import('./stock-transfers/stock-transfer-detail.component').then(
            (m) => m.StockTransferDetailComponent,
          ),
      },
      {
        path: ':transferId/items',
        loadComponent: () =>
          import('./stock-transfers/stock-transfer-detail.component').then(
            (m) => m.StockTransferDetailComponent,
          ),
      },
      {
        path: ':transferId',
        loadComponent: () =>
          import('./stock-transfers/stock-transfer-detail.component').then(
            (m) => m.StockTransferDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'stock-takes',
    canActivate: [permissionGuard('INVENTORY:STOCK_TAKE:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./stock-takes/stock-take-list.component').then(
            (m) => m.StockTakeListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('INVENTORY:STOCK_TAKE:CREATE')],
        loadComponent: () =>
          import('./stock-takes/stock-take-detail.component').then(
            (m) => m.StockTakeDetailComponent,
          ),
      },
      {
        path: ':stockTakeId/items',
        loadComponent: () =>
          import('./stock-takes/stock-take-detail.component').then(
            (m) => m.StockTakeDetailComponent,
          ),
      },
      {
        path: ':stockTakeId',
        loadComponent: () =>
          import('./stock-takes/stock-take-detail.component').then(
            (m) => m.StockTakeDetailComponent,
          ),
      },
    ],
  },
];
