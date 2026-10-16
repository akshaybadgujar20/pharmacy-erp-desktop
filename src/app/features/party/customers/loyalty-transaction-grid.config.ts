import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { LoyaltyTransactionRow } from './customer-loyalty.service';

export const LOYALTY_TRANSACTION_GRID_CONFIG: GridConfig<LoyaltyTransactionRow> = {
  id: 'loyalty-transaction-grid',
  columns: [
    { field: 'transactionDate', headerName: 'Date', sortable: true },
    { field: 'transactionType', headerName: 'Type', filterable: true },
    { field: 'points', headerName: 'Points', type: 'number' },
    { field: 'balanceAfterTransaction', headerName: 'Balance', type: 'number' },
    { field: 'remarks', headerName: 'Remarks' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
};
