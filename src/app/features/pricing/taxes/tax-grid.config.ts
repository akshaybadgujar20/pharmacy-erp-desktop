import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Tax } from './tax.models';

export const TAX_GRID_CONFIG: GridConfig<Tax> = {
  id: 'tax-grid',
  columns: [
    { field: 'taxCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'taxName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'taxType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'taxRate', headerName: 'Rate', sortable: true },
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
      permission: 'PRICING:TAX:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PRICING:TAX:DELETE',
      confirmation: true,
    },
  ],
};
