import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { FinancialYear } from './financial-year.models';

export const FINANCIAL_YEAR_GRID_CONFIG: GridConfig<FinancialYear> = {
  id: 'financial-year-grid',
  columns: [
    { field: 'financialYearCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'financialYearName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'startDate', headerName: 'Start Date', sortable: true },
    { field: 'endDate', headerName: 'End Date', sortable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
    { field: 'isCurrent', headerName: 'Current', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'CONFIGURATION:FINANCIAL_YEAR:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'CONFIGURATION:FINANCIAL_YEAR:DELETE',
      confirmation: true,
    },
  ],
};
