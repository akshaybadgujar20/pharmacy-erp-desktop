import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { OutboxAdminService, OutboxRow } from './outbox-admin.service';

@Component({
  selector: 'app-outbox-list',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <h2>Outbox queue</h2>
    <ul>
      @for (row of rows(); track row.id) {
        <li>
          {{ row.entityType }} — {{ row.syncStatus }}
          @if (row.syncStatus === 'FAILED') {
            <button pButton type="button" label="Retry" (click)="retry(row)"></button>
          }
        </li>
      }
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutboxListComponent implements OnInit {
  private readonly outbox = inject(OutboxAdminService);
  readonly rows = signal<OutboxRow[]>([]);

  ngOnInit(): void {
    this.outbox.list({ page: '1', pageSize: '50' }).subscribe({
      next: ({ data }) => this.rows.set(data),
    });
  }

  retry(row: OutboxRow): void {
    this.outbox.retry(row.id, '0').subscribe({
      next: () => this.ngOnInit(),
    });
  }
}
