import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Payment } from './payment.models';

export const PAYMENT_GRID_CONFIG: GridConfig<Payment> = {
  id: 'payment-grid',
  columns: [
    { field: 'paymentNumber', headerName: 'Payment #', sortable: true, filterable: true },
    { field: 'paymentType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'paymentDate', headerName: 'Date', sortable: true },
    { field: 'amount', headerName: 'Amount', type: 'currency' },
    { field: 'paymentMethod', headerName: 'Method', sortable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
    { field: 'referenceType', headerName: 'Reference Type', sortable: true },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'FINANCE:PAYMENT:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'FINANCE:PAYMENT:DELETE',
      confirmation: true,
    },
  ],
};
