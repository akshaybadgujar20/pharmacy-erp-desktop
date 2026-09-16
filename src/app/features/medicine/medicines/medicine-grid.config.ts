import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Medicine } from './medicine.models';

export const MEDICINE_GRID_CONFIG: GridConfig<Medicine> = {
  id: 'medicine-grid',
  columns: [
    { field: 'medicineCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'medicineName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'dosageForm', headerName: 'Dosage Form', sortable: true, filterable: true },
    { field: 'brandName', headerName: 'Brand', sortable: true, filterable: true },
    { field: 'strength', headerName: 'Strength', sortable: true, filterable: true },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
    { field: 'discontinued', headerName: 'Discontinued', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'MASTER:MEDICINE:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'MASTER:MEDICINE:DELETE',
      confirmation: true,
    },
  ],
};
