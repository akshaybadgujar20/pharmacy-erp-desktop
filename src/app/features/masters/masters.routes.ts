import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const mastersRoutes: Routes = [
  {
    path: 'countries',
    canActivate: [permissionGuard('LOOKUP:COUNTRY:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./countries/country-list.component').then(
            (m) => m.CountryListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('LOOKUP:COUNTRY:CREATE')],
        loadComponent: () =>
          import('./countries/country-detail.component').then(
            (m) => m.CountryDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./countries/country-detail.component').then(
            (m) => m.CountryDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'states',
    canActivate: [permissionGuard('LOOKUP:STATE:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./states/state-list.component').then(
            (m) => m.StateListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('LOOKUP:STATE:CREATE')],
        loadComponent: () =>
          import('./states/state-detail.component').then(
            (m) => m.StateDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./states/state-detail.component').then(
            (m) => m.StateDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'cities',
    canActivate: [permissionGuard('LOOKUP:CITY:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./cities/city-list.component').then(
            (m) => m.CityListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('LOOKUP:CITY:CREATE')],
        loadComponent: () =>
          import('./cities/city-detail.component').then(
            (m) => m.CityDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./cities/city-detail.component').then(
            (m) => m.CityDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'areas',
    canActivate: [permissionGuard('LOOKUP:AREA:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./areas/area-list.component').then((m) => m.AreaListComponent),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('LOOKUP:AREA:CREATE')],
        loadComponent: () =>
          import('./areas/area-detail.component').then(
            (m) => m.AreaDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./areas/area-detail.component').then(
            (m) => m.AreaDetailComponent,
          ),
      },
    ],
  },
];
