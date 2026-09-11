export class GridSelectionState<T> {
  private readonly selectedIds = new Set<string | number>();
  private readonly rowMap = new Map<string | number, T>();

  constructor(
    private readonly getId: (row: T) => string | number,
    private readonly preserveSelection: boolean,
  ) {}

  select(row: T): void {
    const id = this.getId(row);
    this.selectedIds.add(id);
    this.rowMap.set(id, row);
  }

  deselect(row: T): void {
    const id = this.getId(row);
    this.selectedIds.delete(id);
    this.rowMap.delete(id);
  }

  toggle(row: T, selected: boolean): void {
    if (selected) {
      this.select(row);
    } else {
      this.deselect(row);
    }
  }

  clear(): void {
    this.selectedIds.clear();
    this.rowMap.clear();
  }

  isSelected(row: T): boolean {
    return this.selectedIds.has(this.getId(row));
  }

  hasId(id: string | number): boolean {
    return this.selectedIds.has(id);
  }

  getSelectedIds(): Array<string | number> {
    return [...this.selectedIds];
  }

  getSelectedRows(): T[] {
    return [...this.selectedIds]
      .map((id) => this.rowMap.get(id))
      .filter((row): row is T => row !== undefined);
  }

  reconcileData(rows: T[]): void {
    for (const row of rows) {
      const id = this.getId(row);
      if (this.selectedIds.has(id)) {
        this.rowMap.set(id, row);
      }
    }
    if (!this.preserveSelection) {
      const visibleIds = new Set(rows.map((row) => this.getId(row)));
      for (const id of [...this.selectedIds]) {
        if (!visibleIds.has(id)) {
          this.selectedIds.delete(id);
          this.rowMap.delete(id);
        }
      }
    }
  }

  setAll(rows: T[], selected: boolean): void {
    if (selected) {
      for (const row of rows) {
        this.select(row);
      }
    } else {
      for (const row of rows) {
        this.deselect(row);
      }
    }
  }
}
