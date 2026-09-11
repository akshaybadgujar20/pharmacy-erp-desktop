import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ApiClientError } from '../../../core/models/api-response.types';
import { optionalEpochMs, toEpochMs } from '../configuration-date.util';
import { FinancialYearService } from './financial-year.service';

@Component({
  selector: 'app-financial-year-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './financial-year-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialYearDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly financialYearService = inject(FinancialYearService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly closing = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);
  readonly status = signal('');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    financialYearCode: ['', Validators.required],
    financialYearName: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    branchId: [''],
    isCurrent: [false],
    remarks: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isNew.set(false);
      this.entityId = id;
      this.load(id);
    }
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.financialYearService
        .create({
          financialYearCode: value.financialYearCode,
          financialYearName: value.financialYearName,
          startDate: toEpochMs(value.startDate),
          endDate: toEpochMs(value.endDate),
          branchId: value.branchId || undefined,
          isCurrent: value.isCurrent,
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (financialYear) => {
            this.saving.set(false);
            this.router.navigate(['/configuration/financial-years', financialYear.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.financialYearService
      .update(this.entityId!, {
        version: this.version(),
        financialYearCode: value.financialYearCode,
        financialYearName: value.financialYearName,
        startDate: optionalEpochMs(value.startDate),
        endDate: optionalEpochMs(value.endDate),
        branchId: value.branchId || undefined,
        isCurrent: value.isCurrent,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (financialYear) => {
          this.version.set(financialYear.version);
          this.status.set(financialYear.status);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  closeRecord(): void {
    if (!this.entityId) {
      return;
    }

    this.closing.set(true);
    this.errorMessage.set('');
    this.financialYearService.close(this.entityId, this.version()).subscribe({
      next: (financialYear) => {
        this.version.set(financialYear.version);
        this.status.set(financialYear.status);
        this.closing.set(false);
      },
      error: (error) => {
        this.closing.set(false);
        this.handleError(error);
      },
    });
  }

  deleteRecord(): void {
    if (!this.entityId) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.financialYearService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/configuration/financial-years']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/configuration/financial-years']);
  }

  private load(id: string): void {
    this.financialYearService.getById(id).subscribe({
      next: (financialYear) => {
        this.version.set(financialYear.version);
        this.status.set(financialYear.status);
        this.form.patchValue({
          financialYearCode: financialYear.financialYearCode,
          financialYearName: financialYear.financialYearName,
          startDate: financialYear.startDate,
          endDate: financialYear.endDate,
          branchId: financialYear.branchId ?? '',
          isCurrent: financialYear.isCurrent,
          remarks: financialYear.remarks ?? '',
        });
      },
      error: (error) => this.handleError(error),
    });
  }

  private handleError(error: unknown): void {
    this.saving.set(false);
    this.errorMessage.set(
      error instanceof ApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Request failed',
    );
  }
}
