import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const partyRoutes: Routes = [
  {
    path: 'customers',
    canActivate: [permissionGuard('PARTY:CUSTOMER:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./customers/customer-list.component').then(
            (m) => m.CustomerListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('PARTY:CUSTOMER:CREATE')],
        loadComponent: () =>
          import('./customers/customer-detail.component').then(
            (m) => m.CustomerDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./customers/customer-detail.component').then(
            (m) => m.CustomerDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'suppliers',
    canActivate: [permissionGuard('PARTY:SUPPLIER:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./suppliers/supplier-list.component').then(
            (m) => m.SupplierListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('PARTY:SUPPLIER:CREATE')],
        loadComponent: () =>
          import('./suppliers/supplier-detail.component').then(
            (m) => m.SupplierDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./suppliers/supplier-detail.component').then(
            (m) => m.SupplierDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'doctors',
    canActivate: [permissionGuard('PARTY:DOCTOR:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./doctors/doctor-list.component').then(
            (m) => m.DoctorListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('PARTY:DOCTOR:CREATE')],
        loadComponent: () =>
          import('./doctors/doctor-detail.component').then(
            (m) => m.DoctorDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./doctors/doctor-detail.component').then(
            (m) => m.DoctorDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'employees',
    canActivate: [permissionGuard('PARTY:EMPLOYEE:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./employees/employee-list.component').then(
            (m) => m.EmployeeListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('PARTY:EMPLOYEE:CREATE')],
        loadComponent: () =>
          import('./employees/employee-detail.component').then(
            (m) => m.EmployeeDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./employees/employee-detail.component').then(
            (m) => m.EmployeeDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'parties',
    canActivate: [permissionGuard('PARTY:PARTY:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./parties/party-list.component').then(
            (m) => m.PartyListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('PARTY:PARTY:CREATE')],
        loadComponent: () =>
          import('./parties/party-detail.component').then(
            (m) => m.PartyDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./parties/party-detail.component').then(
            (m) => m.PartyDetailComponent,
          ),
      },
    ],
  },
];
