import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { StockTransfer } from './stock-transfer.models';

export const STOCK_TRANSFER_GRID_CONFIG: GridConfig<StockTransfer> = {
  id: 'stock-transfer-grid',
  columns: [
    { field: 'transferNumber', headerName: 'Number', sortable: true, filterable: true },
    { field: 'transferType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
    { field: 'sourceBranchId', headerName: 'Source Branch', sortable: true },
    { field: 'destinationBranchId', headerName: 'Destination Branch', sortable: true },
    { field: 'transferDate', headerName: 'Date', sortable: true },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'INVENTORY:STOCK_TRANSFER:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'INVENTORY:STOCK_TRANSFER:DELETE',
      confirmation: true,
    },
  ],
};
