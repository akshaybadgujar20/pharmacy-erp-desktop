import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const auditRoutes: Routes = [
  {
    path: 'audit-logs',
    canActivate: [permissionGuard('AUDIT:AUDIT_LOG:READ')],
    loadComponent: () =>
      import('./audit-log-list.component').then((m) => m.AuditLogListComponent),
  },
  {
    path: 'change-histories',
    canActivate: [permissionGuard('AUDIT:CHANGE_HISTORY:READ')],
    loadComponent: () =>
      import('./change-history-list.component').then((m) => m.ChangeHistoryListComponent),
  },
];
