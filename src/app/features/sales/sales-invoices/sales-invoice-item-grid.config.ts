import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { SalesInvoiceItem } from './sales-invoice-item.models';

export const SALES_INVOICE_ITEM_GRID_CONFIG: GridConfig<SalesInvoiceItem> = {
  id: 'sales-invoice-item-grid',
  columns: [
    { field: 'lineNumber', headerName: 'Line', type: 'number' },
    { field: 'medicineId', headerName: 'Medicine ID', sortable: true, filterable: true },
    { field: 'batchId', headerName: 'Batch ID', sortable: true, filterable: true },
    { field: 'soldQuantity', headerName: 'Qty', type: 'number' },
    { field: 'unitPrice', headerName: 'Unit Price', type: 'currency' },
    { field: 'lineAmount', headerName: 'Line Amount', type: 'currency' },
    { field: 'remarks', headerName: 'Remarks', filterable: true },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'SALES:SALES_INVOICE:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'SALES:SALES_INVOICE:UPDATE',
      confirmation: true,
    },
  ],
};
