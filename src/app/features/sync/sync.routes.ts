import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const syncRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard('SYNC:SYNC:EXECUTE')],
    loadComponent: () =>
      import('./sync-dashboard.component').then((m) => m.SyncDashboardComponent),
  },
];
