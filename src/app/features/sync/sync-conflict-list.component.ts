import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SyncConflictAdminService, SyncConflictRow } from './sync-conflict.service';

@Component({
  selector: 'app-sync-conflict-list',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <h2>Sync conflicts</h2>
    <ul>
      @for (row of rows(); track row.id) {
        <li>
          {{ row.entityType }} — {{ row.resolutionStatus }}
          <button pButton type="button" label="Resolve" (click)="resolve(row)"></button>
        </li>
      }
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncConflictListComponent implements OnInit {
  private readonly conflicts = inject(SyncConflictAdminService);
  readonly rows = signal<SyncConflictRow[]>([]);

  ngOnInit(): void {
    this.conflicts.list({ page: '1', pageSize: '50' }).subscribe({
      next: ({ data }) => this.rows.set(data),
    });
  }

  resolve(row: SyncConflictRow): void {
    this.conflicts.resolve(row.id, '0', 'Resolved from UI').subscribe({
      next: () => this.ngOnInit(),
    });
  }
}
