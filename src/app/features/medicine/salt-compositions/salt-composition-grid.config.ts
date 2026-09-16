import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { SaltComposition } from './salt-composition.models';

export const SALT_COMPOSITION_GRID_CONFIG: GridConfig<SaltComposition> = {
  id: 'salt-composition-grid',
  columns: [
    { field: 'compositionCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'genericId', headerName: 'Generic ID', sortable: true, filterable: true },
    { field: 'unitId', headerName: 'Unit ID', sortable: true, filterable: true },
    { field: 'strength', headerName: 'Strength', sortable: true, filterable: true },
    { field: 'strengthUnit', headerName: 'Strength Unit', sortable: true, filterable: true },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'MASTER:SALT_COMPOSITION:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'MASTER:SALT_COMPOSITION:DELETE',
      confirmation: true,
    },
  ],
};
