import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { SalesInvoicePayment } from './sales-invoice-payment.models';

export const SALES_INVOICE_PAYMENT_GRID_CONFIG: GridConfig<SalesInvoicePayment> = {
  id: 'sales-invoice-payment-grid',
  columns: [
    { field: 'paymentNumber', headerName: 'Number', sortable: true, filterable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
    { field: 'paymentMethod', headerName: 'Method', sortable: true, filterable: true },
    { field: 'paymentDate', headerName: 'Date', sortable: true },
    { field: 'paymentAmount', headerName: 'Amount', type: 'currency' },
    { field: 'transactionReference', headerName: 'Reference', filterable: true },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'SALES:SALES_PAYMENT:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'SALES:SALES_PAYMENT:DELETE',
      confirmation: true,
    },
  ],
};
