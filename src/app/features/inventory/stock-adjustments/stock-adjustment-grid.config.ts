import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { StockAdjustment } from './stock-adjustment.models';

export const STOCK_ADJUSTMENT_GRID_CONFIG: GridConfig<StockAdjustment> = {
  id: 'stock-adjustment-grid',
  columns: [
    { field: 'adjustmentNumber', headerName: 'Number', sortable: true, filterable: true },
    { field: 'adjustmentType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
    { field: 'adjustmentDate', headerName: 'Date', sortable: true },
    { field: 'reason', headerName: 'Reason', filterable: true },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'INVENTORY:STOCK_ADJUSTMENT:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'INVENTORY:STOCK_ADJUSTMENT:DELETE',
      confirmation: true,
    },
  ],
};
