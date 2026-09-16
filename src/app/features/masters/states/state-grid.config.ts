import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { State } from './state.models';

export const STATE_GRID_CONFIG: GridConfig<State> = {
  id: 'state-grid',
  columns: [
    { field: 'stateCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'stateName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'countryId', headerName: 'Country ID', sortable: true, filterable: true },
    { field: 'gstStateCode', headerName: 'GST Code' },
    { field: 'isoCode', headerName: 'ISO Code' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'LOOKUP:STATE:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'LOOKUP:STATE:DELETE',
      confirmation: true,
    },
  ],
};
