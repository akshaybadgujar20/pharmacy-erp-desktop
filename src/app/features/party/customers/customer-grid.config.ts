import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Customer } from './customer.models';

export const CUSTOMER_GRID_CONFIG: GridConfig<Customer> = {
  id: 'customer-grid',
  columns: [
    { field: 'customerCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'customerType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'creditLimit', headerName: 'Credit Limit', type: 'currency' },
    { field: 'outstandingAmount', headerName: 'Outstanding', type: 'currency' },
    { field: 'paymentTermsDays', headerName: 'Payment Terms', type: 'number' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'PARTY:CUSTOMER:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PARTY:CUSTOMER:DELETE',
      confirmation: true,
    },
  ],
};
