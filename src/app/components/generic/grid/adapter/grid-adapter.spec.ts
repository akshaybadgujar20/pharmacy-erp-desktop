import {
  buildGridOptions,
  normalizeSortModel,
  resolveRowId,
  toColumnDefs,
} from './grid-adapter';
import { GridConfig } from '../types/grid.types';

describe('grid-adapter', () => {
  interface DemoRow {
    id: string;
    name: string;
    amount: number;
    active: boolean;
  }

  const config: GridConfig<DemoRow> = {
    columns: [
      { field: 'id', headerName: 'ID', width: 80, pinned: 'left' },
      { field: 'name', headerName: 'Name', sortable: true, filterable: true },
      { field: 'amount', headerName: 'Amount', type: 'currency', align: 'right' },
      { field: 'hidden', headerName: 'Hidden', visible: false },
    ],
    actions: [
      { id: 'edit', label: 'Edit', icon: 'pi pi-pencil' },
      { id: 'delete', label: 'Delete', icon: 'pi pi-trash' },
    ],
  };

  it('maps columns to ag-grid column definitions', () => {
    const defs = toColumnDefs(config.columns, config.actions);
    expect(defs).toHaveLength(4);
    expect(defs[0].field).toBe('id');
    expect(defs[0].pinned).toBe('left');
    expect(defs[1].headerName).toBe('Name');
    expect(defs[2].valueFormatter).toBeDefined();
    expect(defs.find((d) => d.colId === '__actions')).toBeDefined();
  });

  it('hides columns with visible false', () => {
    const defs = toColumnDefs(config.columns);
    expect(defs.some((d) => d.field === 'hidden')).toBe(false);
  });

  it('resolves stable row id from getId or id field', () => {
    expect(resolveRowId({ id: '42', name: 'Test' })).toBe('42');
    expect(
      resolveRowId({ id: '99', name: 'X' }, (row) => `custom-${row.id}`),
    ).toBe('custom-99');
  });

  it('builds grid options with selection and pagination defaults', () => {
    const options = buildGridOptions({
      ...config,
      selection: { enabled: true, mode: 'multiple', checkbox: true },
      pagination: { enabled: true, pageSize: 25 },
    });
    expect(options.pagination).toBe(true);
    expect(options.paginationPageSize).toBe(25);
    expect(options.getRowId).toBeDefined();
  });

  it('suppresses client pagination for server-side mode', () => {
    const options = buildGridOptions({
      ...config,
      pagination: { enabled: true, serverSide: true },
    });
    expect(options.suppressPaginationPanel).toBe(true);
    expect(options.pagination).toBe(false);
  });

  it('normalizes sort model from column state', () => {
    const sortChange = normalizeSortModel({
      api: {
        getColumnState: () => [
          { colId: 'name', sort: 'asc' },
          { colId: 'amount', sort: 'desc' },
        ],
      },
    } as never);
    expect(sortChange.sort).toEqual([
      { field: 'name', direction: 'asc' },
      { field: 'amount', direction: 'desc' },
    ]);
  });
});
