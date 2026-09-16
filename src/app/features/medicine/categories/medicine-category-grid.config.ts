import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { MedicineCategory } from './medicine-category.models';

export const MEDICINE_CATEGORY_GRID_CONFIG: GridConfig<MedicineCategory> = {
  id: 'medicine-category-grid',
  columns: [
    { field: 'categoryCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'categoryName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'parentCategoryId', headerName: 'Parent ID', sortable: true, filterable: true },
    { field: 'displayOrder', headerName: 'Display Order', type: 'number' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'MASTER:MEDICINE_CATEGORY:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'MASTER:MEDICINE_CATEGORY:DELETE',
      confirmation: true,
    },
  ],
};
