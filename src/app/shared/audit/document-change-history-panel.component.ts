import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import {
  ChangeHistoryRow,
  ChangeHistoryService,
} from '../../features/audit/change-history.service';

@Component({
  selector: 'app-document-change-history-panel',
  standalone: true,
  template: `
    <section class="mt-4">
      <h3>Change history</h3>
      @if (loading()) {
        <p>Loading…</p>
      } @else if (rows().length === 0) {
        <p class="text-surface-500">No changes recorded.</p>
      } @else {
        <ul>
          @for (row of rows(); track row.id) {
            <li>{{ row.changedAt }} — {{ row.fieldName }}: {{ row.oldValue }} → {{ row.newValue }}</li>
          }
        </ul>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentChangeHistoryPanelComponent implements OnInit {
  private readonly changeHistory = inject(ChangeHistoryService);

  readonly entityType = input.required<string>();
  readonly entityId = input.required<string>();

  readonly rows = signal<ChangeHistoryRow[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.changeHistory
      .list({
        page: '1',
        pageSize: '20',
        entityType: this.entityType(),
        entityId: this.entityId(),
      })
      .subscribe({
        next: ({ data }) => {
          this.rows.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
