import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { resolveApiErrorMessage } from '../../core/utils/api-error-message.util';
import { SyncLatestRunResponse, SyncRunResult, SyncService } from './sync.service';

@Component({
  selector: 'app-sync-dashboard',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <section class="sync-dashboard">
      <h2>Synchronization</h2>
      <p>Push local outbox changes to the cloud, then pull and apply remote updates.</p>
      <button pButton type="button" label="Sync now" (click)="runSync()" [loading]="running()"></button>
      @if (lastRun()) {
        <p>
          Push: {{ lastRun()?.push?.status }} — uploaded
          {{ lastRun()?.push?.recordsUploaded }}, failed {{ lastRun()?.push?.failedRecords }},
          conflicts {{ lastRun()?.push?.conflictsDetected ?? 0 }}
        </p>
        <p>
          Pull: {{ lastRun()?.pull?.status }} — downloaded
          {{ lastRun()?.pull?.recordsDownloaded ?? 0 }}, failed
          {{ lastRun()?.pull?.failedRecords ?? 0 }}, conflicts
          {{ lastRun()?.pull?.conflictsDetected ?? 0 }}
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
  readonly lastRun = signal<SyncLatestRunResponse | null>(null);
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
      next: (summary: SyncRunResult) => {
        this.lastRun.set({
          push: {
            syncLogId: summary.push.syncLogId,
            recordsUploaded: summary.push.recordsUploaded,
            recordsDownloaded: 0,
            failedRecords: summary.push.failedRecords,
            conflictsDetected: summary.push.conflictsDetected,
            status: summary.push.status,
          },
          pull: {
            syncLogId: summary.pull.syncLogId,
            recordsUploaded: 0,
            recordsDownloaded: summary.pull.recordsDownloaded,
            failedRecords: summary.pull.failedRecords,
            conflictsDetected: summary.pull.conflictsDetected,
            status: summary.pull.status,
          },
        });
        this.running.set(false);
      },
      error: (error) => {
        this.errorMessage.set(resolveApiErrorMessage(error));
        this.running.set(false);
      },
    });
  }
}