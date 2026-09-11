import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Batch } from './batch.models';

export const BATCH_GRID_CONFIG: GridConfig<Batch> = {
  id: 'batch-grid',
  columns: [
    { field: 'batchNumber', headerName: 'Batch Number', sortable: true, filterable: true },
    { field: 'medicineId', headerName: 'Medicine ID', sortable: true, filterable: true },
    { field: 'expiryDate', headerName: 'Expiry Date', sortable: true },
    { field: 'purchaseRate', headerName: 'Purchase Rate', type: 'currency' },
    { field: 'mrp', headerName: 'MRP', type: 'currency' },
    { field: 'barcode', headerName: 'Barcode', filterable: true },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'INVENTORY:BATCH:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'INVENTORY:BATCH:DELETE',
      confirmation: true,
    },
  ],
};
