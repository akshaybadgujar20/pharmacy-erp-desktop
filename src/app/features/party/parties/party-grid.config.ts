import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Party } from './party.models';

export const PARTY_GRID_CONFIG: GridConfig<Party> = {
  id: 'party-grid',
  columns: [
    { field: 'displayName', headerName: 'Display Name', sortable: true, filterable: true },
    { field: 'partyType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'organizationName', headerName: 'Organization', sortable: true, filterable: true },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
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
