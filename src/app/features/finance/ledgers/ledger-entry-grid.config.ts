import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { LedgerEntry } from './ledger-entry.models';

export const LEDGER_ENTRY_GRID_CONFIG: GridConfig<LedgerEntry> = {
  id: 'ledger-entry-grid',
  columns: [
    { field: 'voucherNumber', headerName: 'Voucher #', sortable: true, filterable: true },
    { field: 'voucherType', headerName: 'Voucher Type', sortable: true, filterable: true },
    { field: 'transactionDate', headerName: 'Date', sortable: true },
    { field: 'debitAmount', headerName: 'Debit', type: 'currency' },
    { field: 'creditAmount', headerName: 'Credit', type: 'currency' },
    { field: 'runningBalance', headerName: 'Balance', type: 'currency' },
    { field: 'narration', headerName: 'Narration', filterable: true },
    { field: 'isPosted', headerName: 'Posted', type: 'boolean' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
};
