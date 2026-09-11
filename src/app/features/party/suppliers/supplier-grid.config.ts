import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Supplier } from './supplier.models';

export const SUPPLIER_GRID_CONFIG: GridConfig<Supplier> = {
  id: 'supplier-grid',
  columns: [
    { field: 'supplierCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'supplierType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'gstin', headerName: 'GSTIN', sortable: true, filterable: true },
    { field: 'creditLimit', headerName: 'Credit Limit', type: 'currency' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'PARTY:SUPPLIER:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PARTY:SUPPLIER:DELETE',
      confirmation: true,
    },
  ],
};
