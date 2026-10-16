import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FinancialYearService } from '../../configuration/financial-years/financial-year.service';
import { ClosingService, PreCloseChecklistResult } from '../closing/closing.service';

@Component({
  selector: 'app-month-end-close',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './month-end-close.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthEndCloseComponent implements OnInit {
  private readonly closingService = inject(ClosingService);
  private readonly financialYears = inject(FinancialYearService);
  private readonly fb = inject(FormBuilder);

  readonly checklist = signal<PreCloseChecklistResult | null>(null);
  readonly financialYearId = signal('');
  readonly financialYearVersion = signal('0');
  readonly closingInProgress = signal(false);
  readonly message = signal('');

  readonly form = this.fb.nonNullable.group({
    branchId: [''],
  });

  ngOnInit(): void {
    this.financialYears.list({ page: '1', pageSize: '10', isCurrent: 'true' }).subscribe({
      next: ({ data }) => {
        const current = data.find((row) => row.isCurrent) ?? data[0];
        if (current) {
          this.financialYearId.set(current.id);
          this.financialYearVersion.set(current.version);
        }
      },
    });
  }

  loadChecklist(): void {
    const branchId = this.form.getRawValue().branchId;
    this.closingService.getPreCloseChecklist(branchId || undefined).subscribe({
      next: (result) => this.checklist.set(result),
    });
  }

  closeFinancialYear(): void {
    const id = this.financialYearId();
    if (!id) {
      return;
    }
    this.closingInProgress.set(true);
    this.financialYears.close(id, this.financialYearVersion()).subscribe({
      next: (year) => {
        this.closingInProgress.set(false);
        this.financialYearVersion.set(year.version);
        this.message.set(`Financial year ${year.financialYearCode} closed.`);
      },
      error: () => this.closingInProgress.set(false),
    });
  }
}
