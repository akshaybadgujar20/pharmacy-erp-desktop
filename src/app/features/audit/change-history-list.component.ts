import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ChangeHistoryRow, ChangeHistoryService } from './change-history.service';

@Component({
  selector: 'app-change-history-list',
  standalone: true,
  template: `
    <h2>Change history</h2>
    <ul>
      @for (row of rows(); track row.id) {
        <li>{{ row.entityType }}#{{ row.entityId }} — {{ row.fieldName }}</li>
      }
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeHistoryListComponent implements OnInit {
  private readonly changeHistory = inject(ChangeHistoryService);
  readonly rows = signal<ChangeHistoryRow[]>([]);

  ngOnInit(): void {
    this.changeHistory.list({ page: '1', pageSize: '50' }).subscribe({
      next: ({ data }) => this.rows.set(data),
    });
  }
}
