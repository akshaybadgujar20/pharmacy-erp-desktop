import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Ledger } from './ledger.models';

export const LEDGER_GRID_CONFIG: GridConfig<Ledger> = {
  id: 'ledger-grid',
  columns: [
    { field: 'ledgerCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'ledgerName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'ledgerType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'normalBalance', headerName: 'Normal Balance', sortable: true },
    { field: 'isSystem', headerName: 'System', type: 'boolean' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'FINANCE:LEDGER:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'FINANCE:LEDGER:DELETE',
      confirmation: true,
    },
  ],
};
