import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { PartyAddress } from './party-address.models';

export const PARTY_ADDRESS_GRID_CONFIG: GridConfig<PartyAddress> = {
  id: 'party-address-grid',
  columns: [
    { field: 'addressType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'addressLine1', headerName: 'Address', sortable: true, filterable: true },
    { field: 'postalCode', headerName: 'Postal Code', sortable: true, filterable: true },
    { field: 'isDefault', headerName: 'Default', type: 'boolean' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'PARTY:PARTY:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PARTY:PARTY:DELETE',
      confirmation: true,
    },
  ],
};
