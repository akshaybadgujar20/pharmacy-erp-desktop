import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Area } from './area.models';

export const AREA_GRID_CONFIG: GridConfig<Area> = {
  id: 'area-grid',
  columns: [
    { field: 'areaCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'areaName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'cityId', headerName: 'City ID', sortable: true, filterable: true },
    { field: 'postalCode', headerName: 'Postal Code' },
    { field: 'deliveryZone', headerName: 'Delivery Zone' },
    { field: 'routeCode', headerName: 'Route Code' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'LOOKUP:AREA:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'LOOKUP:AREA:DELETE',
      confirmation: true,
    },
  ],
};
