import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { resolveApiErrorMessage } from '../../core/utils/api-error-message.util';
import { SyncRunSummary, SyncService } from './sync.service';

@Component({
  selector: 'app-sync-dashboard',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <section class="sync-dashboard">
      <h2>Synchronization</h2>
      <p>Push pending outbox changes to the configured cloud endpoint.</p>
      <button pButton type="button" label="Sync now" (click)="runSync()" [loading]="running()"></button>
      @if (lastRun()) {
        <p>
          Last run: {{ lastRun()?.status }} — uploaded {{ lastRun()?.recordsUploaded }},
          failed {{ lastRun()?.failedRecords }}
        </p>
      }
      @if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncDashboardComponent implements OnInit {
  private readonly syncService = inject(SyncService);

  readonly running = signal(false);
  readonly lastRun = signal<SyncRunSummary | null>(null);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.syncService.latest().subscribe({
      next: (run) => this.lastRun.set(run),
      error: () => undefined,
    });

    window.addEventListener('electron-sync-run', () => this.runSync());
  }

  runSync(): void {
    this.running.set(true);
    this.errorMessage.set('');
    this.syncService.runNow().subscribe({
      next: (summary) => {
        this.lastRun.set(summary);
        this.running.set(false);
      },
      error: (error) => {
        this.errorMessage.set(resolveApiErrorMessage(error));
        this.running.set(false);
      },
    });
  }
}
