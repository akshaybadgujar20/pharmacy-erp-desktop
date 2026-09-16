import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Country } from './country.models';

export const COUNTRY_GRID_CONFIG: GridConfig<Country> = {
  id: 'country-grid',
  columns: [
    { field: 'countryCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'countryName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'isoAlpha2', headerName: 'ISO Alpha-2', sortable: true, filterable: true },
    { field: 'isoAlpha3', headerName: 'ISO Alpha-3', sortable: true, filterable: true },
    { field: 'phoneCode', headerName: 'Phone Code' },
    { field: 'currencyCode', headerName: 'Currency' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'LOOKUP:COUNTRY:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'LOOKUP:COUNTRY:DELETE',
      confirmation: true,
    },
  ],
};
