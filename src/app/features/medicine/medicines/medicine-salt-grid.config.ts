import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { MedicineSalt } from './medicine-salt.models';

export const MEDICINE_SALT_GRID_CONFIG: GridConfig<MedicineSalt> = {
  id: 'medicine-salt-grid',
  columns: [
    { field: 'sequenceNo', headerName: 'Sequence', type: 'number' },
    { field: 'saltCompositionId', headerName: 'Salt Composition ID', sortable: true, filterable: true },
    { field: 'medicineGenericId', headerName: 'Generic ID', sortable: true, filterable: true },
    { field: 'percentage', headerName: 'Percentage', sortable: true, filterable: true },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'MASTER:MEDICINE_SALT:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'MASTER:MEDICINE_SALT:DELETE',
      confirmation: true,
    },
  ],
};
