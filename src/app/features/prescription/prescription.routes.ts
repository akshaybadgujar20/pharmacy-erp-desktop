import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const prescriptionRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard('PRESCRIPTION:PRESCRIPTION:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./prescriptions/prescription-list.component').then(
            (m) => m.PrescriptionListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('PRESCRIPTION:PRESCRIPTION:CREATE')],
        loadComponent: () =>
          import('./prescriptions/prescription-detail.component').then(
            (m) => m.PrescriptionDetailComponent,
          ),
      },
      {
        path: ':prescriptionId/items',
        loadComponent: () =>
          import('./prescriptions/prescription-detail.component').then(
            (m) => m.PrescriptionDetailComponent,
          ),
      },
      {
        path: ':prescriptionId',
        loadComponent: () =>
          import('./prescriptions/prescription-detail.component').then(
            (m) => m.PrescriptionDetailComponent,
          ),
      },
    ],
  },
];
