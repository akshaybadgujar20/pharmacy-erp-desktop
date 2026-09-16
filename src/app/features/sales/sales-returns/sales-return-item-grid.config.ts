import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { SalesReturnItem } from './sales-return-item.models';

export const SALES_RETURN_ITEM_GRID_CONFIG: GridConfig<SalesReturnItem> = {
  id: 'sales-return-item-grid',
  columns: [
    { field: 'lineNumber', headerName: 'Line', type: 'number' },
    { field: 'medicineId', headerName: 'Medicine ID', sortable: true, filterable: true },
    { field: 'batchId', headerName: 'Batch ID', sortable: true, filterable: true },
    { field: 'returnQuantity', headerName: 'Qty', type: 'number' },
    { field: 'unitPrice', headerName: 'Unit Price', type: 'currency' },
    { field: 'lineAmount', headerName: 'Line Amount', type: 'currency' },
    { field: 'disposition', headerName: 'Disposition', filterable: true },
    { field: 'returnReason', headerName: 'Reason', filterable: true },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'SALES:SALES_RETURN:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'SALES:SALES_RETURN:UPDATE',
      confirmation: true,
    },
  ],
};
