import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Receipt } from './receipt.models';

export const RECEIPT_GRID_CONFIG: GridConfig<Receipt> = {
  id: 'receipt-grid',
  columns: [
    { field: 'receiptNumber', headerName: 'Receipt #', sortable: true, filterable: true },
    { field: 'receiptType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'receiptDate', headerName: 'Date', sortable: true },
    { field: 'amount', headerName: 'Amount', type: 'currency' },
    { field: 'receiptMethod', headerName: 'Method', sortable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
    { field: 'referenceType', headerName: 'Reference Type', sortable: true },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'FINANCE:RECEIPT:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'FINANCE:RECEIPT:DELETE',
      confirmation: true,
    },
  ],
};
