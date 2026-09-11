import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { PartyRole } from './party-role.models';

export const PARTY_ROLE_GRID_CONFIG: GridConfig<PartyRole> = {
  id: 'party-role-grid',
  columns: [
    { field: 'roleType', headerName: 'Role Type', sortable: true, filterable: true },
    { field: 'isPrimary', headerName: 'Primary', type: 'boolean' },
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
