# AppGrid

Configuration-driven grid wrapper around AG Grid for pharmacy ERP list screens.

## Location

```text
src/app/components/generic/grid/
```

Page-specific configs live next to feature components (e.g. `customer-grid.config.ts`).

## Usage

```html
<app-grid
  [config]="gridConfig"
  [data]="rows"
  [loading]="loading"
  [totalRecords]="total"
  (selectionChange)="onSelectionChange($event)"
  (filterChange)="onFilterChange($event)"
  (sortChange)="onSortChange($event)"
  (pageChange)="onPageChange($event)"
  (action)="onAction($event)"
/>
```

```ts
import { GridConfig } from '../../components/generic/grid';

export const gridConfig: GridConfig<Customer> = {
  columns: [
    { field: 'customerCode', headerName: 'Code', sortable: true },
    { field: 'customerType', headerName: 'Type', type: 'status' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, pageSize: 25 },
};
```

## Client vs server mode

**Client-side (default):** Pass `[data]`. AppGrid handles sort, filter, and pagination internally.

**Server-side:** Set `pagination.serverSide`, `filtering.serverSide`, and/or `sorting.serverSide` to `true`. Parent owns data loading:

```ts
onPageChange(event: GridPageChange) {
  this.facade.setPage(event.page, event.pageSize);
}

onFilterChange(event: GridFilterChange) {
  this.facade.setSearch(event.globalSearch ?? '');
}
```

Use `ApiService.getPaginated<T>()` for list endpoints that return `{ data, pagination }`.

## Events

| Output | Payload |
|--------|---------|
| `selectionChange` | `{ selectedRows, selectedIds }` |
| `filterChange` | `{ filters, globalSearch? }` |
| `sortChange` | `{ sort: GridSort[] }` |
| `pageChange` | `{ page, pageSize }` |
| `action` | `{ action, row?, rows? }` |
| `rowClick` | `{ row }` |
| `rowDoubleClick` | `{ row, action? }` |

## Rules

- Config defines presentation and generic grid behavior only.
- No business service callbacks in config.
- No raw AG Grid types in feature components.
- Use `row.getId` for stable row identity across pages and refreshes.

## Extension points

- `cellRenderer` on `GridColumn` for custom cells
- `formatter` or `type` for built-in value formatting
- `permission` on row/toolbar actions (checked via `AuthService`)
