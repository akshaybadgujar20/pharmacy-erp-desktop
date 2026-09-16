import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const medicineRoutes: Routes = [
  {
    path: 'medicines',
    canActivate: [permissionGuard('MASTER:MEDICINE:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./medicines/medicine-list.component').then(
            (m) => m.MedicineListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('MASTER:MEDICINE:CREATE')],
        loadComponent: () =>
          import('./medicines/medicine-detail.component').then(
            (m) => m.MedicineDetailComponent,
          ),
      },
      {
        path: ':medicineId/salts',
        loadComponent: () =>
          import('./medicines/medicine-detail.component').then(
            (m) => m.MedicineDetailComponent,
          ),
      },
      {
        path: ':medicineId',
        loadComponent: () =>
          import('./medicines/medicine-detail.component').then(
            (m) => m.MedicineDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'categories',
    canActivate: [permissionGuard('MASTER:MEDICINE_CATEGORY:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./categories/medicine-category-list.component').then(
            (m) => m.MedicineCategoryListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('MASTER:MEDICINE_CATEGORY:CREATE')],
        loadComponent: () =>
          import('./categories/medicine-category-detail.component').then(
            (m) => m.MedicineCategoryDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./categories/medicine-category-detail.component').then(
            (m) => m.MedicineCategoryDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'generics',
    canActivate: [permissionGuard('MASTER:MEDICINE_GENERIC:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./generics/medicine-generic-list.component').then(
            (m) => m.MedicineGenericListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('MASTER:MEDICINE_GENERIC:CREATE')],
        loadComponent: () =>
          import('./generics/medicine-generic-detail.component').then(
            (m) => m.MedicineGenericDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./generics/medicine-generic-detail.component').then(
            (m) => m.MedicineGenericDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'schedules',
    canActivate: [permissionGuard('MASTER:MEDICINE_SCHEDULE:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./schedules/medicine-schedule-list.component').then(
            (m) => m.MedicineScheduleListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('MASTER:MEDICINE_SCHEDULE:CREATE')],
        loadComponent: () =>
          import('./schedules/medicine-schedule-detail.component').then(
            (m) => m.MedicineScheduleDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./schedules/medicine-schedule-detail.component').then(
            (m) => m.MedicineScheduleDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'manufacturers',
    canActivate: [permissionGuard('MASTER:MANUFACTURER:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./manufacturers/manufacturer-list.component').then(
            (m) => m.ManufacturerListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('MASTER:MANUFACTURER:CREATE')],
        loadComponent: () =>
          import('./manufacturers/manufacturer-detail.component').then(
            (m) => m.ManufacturerDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./manufacturers/manufacturer-detail.component').then(
            (m) => m.ManufacturerDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'salt-compositions',
    canActivate: [permissionGuard('MASTER:SALT_COMPOSITION:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./salt-compositions/salt-composition-list.component').then(
            (m) => m.SaltCompositionListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('MASTER:SALT_COMPOSITION:CREATE')],
        loadComponent: () =>
          import('./salt-compositions/salt-composition-detail.component').then(
            (m) => m.SaltCompositionDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./salt-compositions/salt-composition-detail.component').then(
            (m) => m.SaltCompositionDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'units-of-measure',
    canActivate: [permissionGuard('MASTER:UNIT_OF_MEASURE:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./units-of-measure/unit-of-measure-list.component').then(
            (m) => m.UnitOfMeasureListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('MASTER:UNIT_OF_MEASURE:CREATE')],
        loadComponent: () =>
          import('./units-of-measure/unit-of-measure-detail.component').then(
            (m) => m.UnitOfMeasureDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./units-of-measure/unit-of-measure-detail.component').then(
            (m) => m.UnitOfMeasureDetailComponent,
          ),
      },
    ],
  },
];
