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
} from '../pricing-date.util';
import { TaxService } from './tax.service';

@Component({
  selector: 'app-tax-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './tax-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly taxService = inject(TaxService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    taxCode: ['', Validators.required],
    taxName: ['', Validators.required],
    taxType: ['GST', Validators.required],
    taxRate: ['', Validators.required],
    effectiveFrom: ['', Validators.required],
    effectiveTo: [''],
    isActive: [true],
    description: [''],
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
      effectiveFrom: new Date().toISOString(),
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
      this.taxService
        .create({
          taxCode: value.taxCode,
          taxName: value.taxName,
          taxType: value.taxType,
          taxRate: value.taxRate,
          effectiveFrom: toEpochMs(value.effectiveFrom),
          effectiveTo: optionalEpochMs(value.effectiveTo),
          isActive: value.isActive,
          description: value.description || undefined,
        })
        .subscribe({
          next: (tax) => {
            this.saving.set(false);
            this.router.navigate(['/pricing/taxes', tax.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.taxService
      .update(this.entityId!, {
        version: this.version(),
        taxCode: value.taxCode,
        taxName: value.taxName,
        taxType: value.taxType,
        taxRate: value.taxRate,
        effectiveFrom: optionalEpochMs(value.effectiveFrom),
        effectiveTo: nullableEpochMs(value.effectiveTo),
        isActive: value.isActive,
        description: value.description || undefined,
      })
      .subscribe({
        next: (tax) => {
          this.version.set(tax.version);
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
    this.taxService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/pricing/taxes']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/pricing/taxes']);
  }

  private load(id: string): void {
    this.taxService.getById(id).subscribe({
      next: (tax) => {
        this.version.set(tax.version);
        this.form.patchValue({
          taxCode: tax.taxCode,
          taxName: tax.taxName,
          taxType: tax.taxType,
          taxRate: tax.taxRate,
          effectiveFrom: tax.effectiveFrom,
          effectiveTo: tax.effectiveTo ?? '',
          isActive: tax.isActive,
          description: tax.description ?? '',
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
