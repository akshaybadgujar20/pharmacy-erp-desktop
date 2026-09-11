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
import { ReceiptService } from './receipt.service';

@Component({
  selector: 'app-receipt-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule],
  templateUrl: './receipt-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly receiptService = inject(ReceiptService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly workflowInProgress = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);
  readonly status = signal('PENDING');
  readonly receiptNumber = signal('');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    receiptType: ['CUSTOMER_PAYMENT', Validators.required],
    receiptDate: ['', Validators.required],
    amount: [null as number | null, Validators.required],
    receiptMethod: ['CASH', Validators.required],
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
      receiptDate: new Date().toISOString(),
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
      this.receiptService
        .create({
          receiptType: value.receiptType,
          receiptDate: toEpochMs(value.receiptDate),
          amount: value.amount!,
          receiptMethod: value.receiptMethod,
          transactionReference: value.transactionReference || undefined,
          referenceType: value.referenceType || undefined,
          referenceId: value.referenceId || undefined,
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (receipt) => {
            this.saving.set(false);
            this.router.navigate(['/finance/receipts', receipt.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.receiptService
      .update(this.entityId!, {
        version: this.version(),
        receiptType: value.receiptType,
        receiptDate: toEpochMs(value.receiptDate),
        amount: value.amount!,
        receiptMethod: value.receiptMethod,
        transactionReference: value.transactionReference || undefined,
        referenceType: value.referenceType || undefined,
        referenceId: value.referenceId || undefined,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (receipt) => {
          this.version.set(receipt.version);
          this.status.set(receipt.status);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  completeReceipt(): void {
    if (!this.entityId) {
      return;
    }

    this.workflowInProgress.set(true);
    this.errorMessage.set('');
    this.receiptService
      .complete(this.entityId, { version: this.version() })
      .subscribe({
        next: (receipt) => {
          this.version.set(receipt.version);
          this.status.set(receipt.status);
          this.workflowInProgress.set(false);
        },
        error: (error) => {
          this.workflowInProgress.set(false);
          this.handleError(error);
        },
      });
  }

  cancelReceipt(): void {
    if (!this.entityId) {
      return;
    }

    this.workflowInProgress.set(true);
    this.errorMessage.set('');
    this.receiptService
      .cancel(this.entityId, { version: this.version() })
      .subscribe({
        next: (receipt) => {
          this.version.set(receipt.version);
          this.status.set(receipt.status);
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
    this.receiptService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/finance/receipts']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/finance/receipts']);
  }

  private load(id: string): void {
    this.receiptService.getById(id).subscribe({
      next: (receipt) => {
        this.version.set(receipt.version);
        this.status.set(receipt.status);
        this.receiptNumber.set(receipt.receiptNumber);
        this.form.patchValue({
          receiptType: receipt.receiptType,
          receiptDate: fromEpochMs(receipt.receiptDate),
          amount: receipt.amount,
          receiptMethod: receipt.receiptMethod,
          transactionReference: receipt.transactionReference ?? '',
          referenceType: receipt.referenceType ?? '',
          referenceId: receipt.referenceId ?? '',
          remarks: receipt.remarks ?? '',
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
