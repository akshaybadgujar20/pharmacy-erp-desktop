import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { City } from './city.models';

export const CITY_GRID_CONFIG: GridConfig<City> = {
  id: 'city-grid',
  columns: [
    { field: 'cityCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'cityName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'stateId', headerName: 'State ID', sortable: true, filterable: true },
    { field: 'district', headerName: 'District' },
    { field: 'postalRegion', headerName: 'Postal Region' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'LOOKUP:CITY:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'LOOKUP:CITY:DELETE',
      confirmation: true,
    },
  ],
};
