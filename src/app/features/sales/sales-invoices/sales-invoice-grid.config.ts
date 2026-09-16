import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { SalesInvoice } from './sales-invoice.models';

export const SALES_INVOICE_GRID_CONFIG: GridConfig<SalesInvoice> = {
  id: 'sales-invoice-grid',
  columns: [
    { field: 'invoiceNumber', headerName: 'Number', sortable: true, filterable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
    { field: 'paymentStatus', headerName: 'Payment', sortable: true, filterable: true },
    { field: 'salesType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'invoiceDate', headerName: 'Date', sortable: true },
    { field: 'netAmount', headerName: 'Net Amount', type: 'currency' },
    { field: 'customerId', headerName: 'Customer ID', filterable: true },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
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
      permission: 'SALES:SALES_INVOICE:DELETE',
      confirmation: true,
    },
  ],
};
