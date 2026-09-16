import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Manufacturer } from './manufacturer.models';

export const MANUFACTURER_GRID_CONFIG: GridConfig<Manufacturer> = {
  id: 'manufacturer-grid',
  columns: [
    { field: 'manufacturerCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'partyId', headerName: 'Party ID', sortable: true, filterable: true },
    { field: 'gstin', headerName: 'GSTIN', sortable: true, filterable: true },
    { field: 'email', headerName: 'Email', sortable: true, filterable: true },
    { field: 'isPreferred', headerName: 'Preferred', type: 'boolean' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'MASTER:MANUFACTURER:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'MASTER:MANUFACTURER:DELETE',
      confirmation: true,
    },
  ],
};
