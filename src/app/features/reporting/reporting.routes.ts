import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const reportingRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard('REPORT_VIEW')],
    loadComponent: () =>
      import('./report-list.component').then((m) => m.ReportListComponent),
  },
  {
    path: ':reportId',
    canActivate: [permissionGuard('REPORT_VIEW')],
    loadComponent: () =>
      import('./report-runner.component').then((m) => m.ReportRunnerComponent),
  },
];
