import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { PrescriptionItem } from './prescription-item.models';

export const PRESCRIPTION_ITEM_GRID_CONFIG: GridConfig<PrescriptionItem> = {
  id: 'prescription-item-grid',
  columns: [
    { field: 'lineNumber', headerName: 'Line', type: 'number', sortable: true },
    { field: 'medicineId', headerName: 'Medicine ID', sortable: true, filterable: true },
    { field: 'unitId', headerName: 'Unit ID', sortable: true, filterable: true },
    { field: 'prescribedQuantity', headerName: 'Prescribed Qty', sortable: true },
    { field: 'dispensedQuantity', headerName: 'Dispensed Qty', sortable: true },
    { field: 'remainingQuantity', headerName: 'Remaining Qty', sortable: true },
    { field: 'dosage', headerName: 'Dosage', sortable: true },
    { field: 'frequency', headerName: 'Frequency', sortable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'PRESCRIPTION:PRESCRIPTION_ITEM:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PRESCRIPTION:PRESCRIPTION_ITEM:DELETE',
      confirmation: true,
    },
  ],
};
