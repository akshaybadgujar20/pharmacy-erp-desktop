import { GridConfig } from '../../components/generic/grid/types/grid.types';
import { LoyaltyProgramRow } from './loyalty-program.service';

export const LOYALTY_PROGRAM_GRID_CONFIG: GridConfig<LoyaltyProgramRow> = {
  id: 'loyalty-program-grid',
  columns: [
    { field: 'programCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'programName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'isDefault', headerName: 'Default', type: 'boolean' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: false, serverSide: true },
};
