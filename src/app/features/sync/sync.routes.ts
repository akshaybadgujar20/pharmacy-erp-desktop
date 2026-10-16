import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const syncRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard('SYNC:SYNC:EXECUTE')],
    loadComponent: () =>
      import('./sync-dashboard.component').then((m) => m.SyncDashboardComponent),
  },
  {
    path: 'outbox',
    canActivate: [permissionGuard('SYNC:OUTBOX:READ')],
    loadComponent: () =>
      import('./outbox-list.component').then((m) => m.OutboxListComponent),
  },
  {
    path: 'conflicts',
    canActivate: [permissionGuard('SYNC:SYNC_CONFLICT:READ')],
    loadComponent: () =>
      import('./sync-conflict-list.component').then((m) => m.SyncConflictListComponent),
  },
];
