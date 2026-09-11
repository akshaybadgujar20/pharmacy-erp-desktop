import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { AppGridComponent } from '../../../components/generic/grid';
import {
  GridFilterChange,
  GridPageChange,
} from '../../../components/generic/grid/types/grid-events.types';
import { toListParams } from '../../../shared/utils/list-query.util';
import { LEDGER_ENTRY_GRID_CONFIG } from './ledger-entry-grid.config';
import { LedgerEntry } from './ledger-entry.models';
import { LedgerEntryService } from './ledger-entry.service';

@Component({
  selector: 'app-ledger-entries-tab',
  standalone: true,
  imports: [AppGridComponent],
  templateUrl: './ledger-entries-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LedgerEntriesTabComponent {
  private readonly ledgerEntryService = inject(LedgerEntryService);

  readonly ledgerId = input.required<string>();

  readonly gridConfig = LEDGER_ENTRY_GRID_CONFIG;
  readonly rows = signal<LedgerEntry[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly search = signal('');

  constructor() {
    effect(() => {
      const id = this.ledgerId();
      if (id) {
        this.load();
      }
    });
  }

  onPageChange(event: GridPageChange): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onFilterChange(event: GridFilterChange): void {
    this.search.set(event.globalSearch ?? '');
    this.page.set(1);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.ledgerEntryService
      .list({
        ...toListParams(this.page(), this.pageSize(), this.search()),
        ledgerId: this.ledgerId(),
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.data);
          this.totalRecords.set(result.pagination.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
