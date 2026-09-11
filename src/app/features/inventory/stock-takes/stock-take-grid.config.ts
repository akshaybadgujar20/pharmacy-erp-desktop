import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { StockTake } from './stock-take.models';

export const STOCK_TAKE_GRID_CONFIG: GridConfig<StockTake> = {
  id: 'stock-take-grid',
  columns: [
    { field: 'stockTakeNumber', headerName: 'Number', sortable: true, filterable: true },
    { field: 'countType', headerName: 'Count Type', sortable: true, filterable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
    { field: 'stockTakeDate', headerName: 'Date', sortable: true },
    { field: 'countedByEmployeeId', headerName: 'Counted By', sortable: true },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
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
