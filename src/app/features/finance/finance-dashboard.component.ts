import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ReportRunnerComponent } from '../reporting/report-runner.component';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [ReportRunnerComponent, TranslatePipe],
  template: `
    <section class="page-layout finance-dashboard">
      <h1>{{ 'finance.dashboardTitle' | translate }}</h1>
      <p class="finance-dashboard__intro">{{ 'finance.dashboardIntro' | translate }}</p>
      <article class="finance-dashboard__panel">
        <h2>{{ 'finance.trialBalancePanel' | translate }}</h2>
        <app-report-runner embeddedReportId="finance.trial-balance" [embedded]="true" />
      </article>
      <article class="finance-dashboard__panel">
        <h2>{{ 'finance.gstSummaryPanel' | translate }}</h2>
        <app-report-runner embeddedReportId="finance.gst-summary" [embedded]="true" />
      </article>
    </section>
  `,
  styles: `
    .finance-dashboard__panel {
      margin-block: 1.5rem;
      padding: 1rem;
      border: 1px solid var(--surface-border, #dee2e6);
      border-radius: 4px;
    }
    .finance-dashboard__intro {
      color: var(--text-color-secondary, #6c757d);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceDashboardComponent {}