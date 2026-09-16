import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { MedicineGeneric } from './medicine-generic.models';

export const MEDICINE_GENERIC_GRID_CONFIG: GridConfig<MedicineGeneric> = {
  id: 'medicine-generic-grid',
  columns: [
    { field: 'genericCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'genericName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'therapeuticClass', headerName: 'Therapeutic Class', sortable: true, filterable: true },
    { field: 'pharmacologicalClass', headerName: 'Pharmacological Class', sortable: true, filterable: true },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'MASTER:MEDICINE_GENERIC:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'MASTER:MEDICINE_GENERIC:DELETE',
      confirmation: true,
    },
  ],
};
