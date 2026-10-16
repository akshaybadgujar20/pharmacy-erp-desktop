import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AuditLogRow, AuditLogService } from './audit-log.service';

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  template: `
    <h2>Audit logs</h2>
    <ul>
      @for (row of rows(); track row.id) {
        <li>{{ row.createdAt }} — {{ row.module }} {{ row.action }}: {{ row.summary }}</li>
      }
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogListComponent implements OnInit {
  private readonly auditLogs = inject(AuditLogService);
  readonly rows = signal<AuditLogRow[]>([]);

  ngOnInit(): void {
    this.auditLogs.list({ page: '1', pageSize: '50' }).subscribe({
      next: ({ data }) => this.rows.set(data),
    });
  }
}
