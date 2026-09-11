import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { StockTakeItem } from './stock-take-item.models';

export const STOCK_TAKE_ITEM_GRID_CONFIG: GridConfig<StockTakeItem> = {
  id: 'stock-take-item-grid',
  columns: [
    { field: 'batchId', headerName: 'Batch ID', sortable: true, filterable: true },
    { field: 'systemQuantity', headerName: 'System Qty', type: 'number' },
    { field: 'physicalQuantity', headerName: 'Physical Qty', type: 'number' },
    { field: 'varianceQuantity', headerName: 'Variance', type: 'number' },
    { field: 'varianceType', headerName: 'Variance Type', sortable: true },
    { field: 'isReconciled', headerName: 'Reconciled', type: 'boolean' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'INVENTORY:STOCK_TAKE:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'INVENTORY:STOCK_TAKE:DELETE',
      confirmation: true,
    },
  ],
};
