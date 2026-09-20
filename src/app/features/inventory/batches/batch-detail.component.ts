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
import {
  nullableEpochMs,
  optionalEpochMs,
  toEpochMs,
} from '../inventory-date.util';
import { BatchService } from './batch.service';

@Component({
  selector: 'app-batch-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './batch-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly batchService = inject(BatchService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    medicineId: ['', Validators.required],
    batchNumber: ['', Validators.required],
    manufacturingDate: [''],
    expiryDate: ['', Validators.required],
    purchaseRate: [0, Validators.required],
    mrp: [0, Validators.required],
    barcode: [''],
    isActive: [true],
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
      this.batchService
        .create({
          medicineId: value.medicineId,
          batchNumber: value.batchNumber,
          manufacturingDate: optionalEpochMs(value.manufacturingDate),
          expiryDate: toEpochMs(value.expiryDate),
          purchaseRate: value.purchaseRate,
          mrp: value.mrp,
          barcode: value.barcode || undefined,
          isActive: value.isActive,
        })
        .subscribe({
          next: (batch) => {
            this.saving.set(false);
            this.router.navigate(['/inventory/batches', batch.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.batchService
      .update(this.entityId!, {
        version: this.version(),
        medicineId: value.medicineId,
        batchNumber: value.batchNumber,
        manufacturingDate: nullableEpochMs(value.manufacturingDate),
        expiryDate: toEpochMs(value.expiryDate),
        purchaseRate: value.purchaseRate,
        mrp: value.mrp,
        barcode: value.barcode || undefined,
        isActive: value.isActive,
      })
      .subscribe({
        next: (batch) => {
          this.version.set(batch.version);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  deleteRecord(): void {
    if (!this.entityId) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.batchService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/inventory/batches']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/inventory/batches']);
  }

  private load(id: string): void {
    this.batchService.getById(id).subscribe({
      next: (batch) => {
        this.version.set(batch.version);
        this.form.patchValue({
          medicineId: batch.medicineId,
          batchNumber: batch.batchNumber,
          manufacturingDate: batch.manufacturingDate ?? '',
          expiryDate: batch.expiryDate,
          purchaseRate: batch.purchaseRate,
          mrp: batch.mrp,
          barcode: batch.barcode ?? '',
          isActive: batch.isActive,
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
