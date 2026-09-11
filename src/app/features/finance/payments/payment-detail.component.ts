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
import { InputTextModule } from 'primeng/inputtext';
import { ApiClientError } from '../../../core/models/api-response.types';
import { fromEpochMs, toEpochMs } from '../finance-date.util';
import { PaymentService } from './payment.service';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule],
  templateUrl: './payment-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly workflowInProgress = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);
  readonly status = signal('PENDING');
  readonly paymentNumber = signal('');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    paymentType: ['SUPPLIER_PAYMENT', Validators.required],
    paymentDate: ['', Validators.required],
    amount: [null as number | null, Validators.required],
    paymentMethod: ['CASH', Validators.required],
    transactionReference: [''],
    referenceType: [''],
    referenceId: [''],
    remarks: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isNew.set(false);
      this.entityId = id;
      this.load(id);
      return;
    }
    this.form.patchValue({
      paymentDate: new Date().toISOString(),
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.paymentService
        .create({
          paymentType: value.paymentType,
          paymentDate: toEpochMs(value.paymentDate),
          amount: value.amount!,
          paymentMethod: value.paymentMethod,
          transactionReference: value.transactionReference || undefined,
          referenceType: value.referenceType || undefined,
          referenceId: value.referenceId || undefined,
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (payment) => {
            this.saving.set(false);
            this.router.navigate(['/finance/payments', payment.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.paymentService
      .update(this.entityId!, {
        version: this.version(),
        paymentType: value.paymentType,
        paymentDate: toEpochMs(value.paymentDate),
        amount: value.amount!,
        paymentMethod: value.paymentMethod,
        transactionReference: value.transactionReference || undefined,
        referenceType: value.referenceType || undefined,
        referenceId: value.referenceId || undefined,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (payment) => {
          this.version.set(payment.version);
          this.status.set(payment.status);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  completePayment(): void {
    if (!this.entityId) {
      return;
    }

    this.workflowInProgress.set(true);
    this.errorMessage.set('');
    this.paymentService
      .complete(this.entityId, { version: this.version() })
      .subscribe({
        next: (payment) => {
          this.version.set(payment.version);
          this.status.set(payment.status);
          this.workflowInProgress.set(false);
        },
        error: (error) => {
          this.workflowInProgress.set(false);
          this.handleError(error);
        },
      });
  }

  cancelPayment(): void {
    if (!this.entityId) {
      return;
    }

    this.workflowInProgress.set(true);
    this.errorMessage.set('');
    this.paymentService
      .cancel(this.entityId, { version: this.version() })
      .subscribe({
        next: (payment) => {
          this.version.set(payment.version);
          this.status.set(payment.status);
          this.workflowInProgress.set(false);
        },
        error: (error) => {
          this.workflowInProgress.set(false);
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
    this.paymentService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/finance/payments']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/finance/payments']);
  }

  private load(id: string): void {
    this.paymentService.getById(id).subscribe({
      next: (payment) => {
        this.version.set(payment.version);
        this.status.set(payment.status);
        this.paymentNumber.set(payment.paymentNumber);
        this.form.patchValue({
          paymentType: payment.paymentType,
          paymentDate: fromEpochMs(payment.paymentDate),
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          transactionReference: payment.transactionReference ?? '',
          referenceType: payment.referenceType ?? '',
          referenceId: payment.referenceId ?? '',
          remarks: payment.remarks ?? '',
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
