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
import { SupplierService } from './supplier.service';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './supplier-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supplierService = inject(SupplierService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    partyId: ['', Validators.required],
    supplierCode: ['', Validators.required],
    supplierType: ['DISTRIBUTOR', Validators.required],
    gstin: [''],
    drugLicenseNumber: [''],
    panNumber: [''],
    creditLimit: [null as number | null],
    paymentTermsDays: [0],
    preferredSupplier: [false],
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
      this.supplierService
        .create({
          partyId: value.partyId,
          supplierCode: value.supplierCode,
          supplierType: value.supplierType,
          gstin: value.gstin || undefined,
          drugLicenseNumber: value.drugLicenseNumber || undefined,
          panNumber: value.panNumber || undefined,
          creditLimit: value.creditLimit ?? undefined,
          paymentTermsDays: value.paymentTermsDays,
          preferredSupplier: value.preferredSupplier,
          isActive: value.isActive,
        })
        .subscribe({
          next: (supplier) => {
            this.saving.set(false);
            this.router.navigate(['/party/suppliers', supplier.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.supplierService
      .update(this.entityId!, {
        version: this.version(),
        supplierCode: value.supplierCode,
        supplierType: value.supplierType,
        gstin: value.gstin || undefined,
        drugLicenseNumber: value.drugLicenseNumber || undefined,
        panNumber: value.panNumber || undefined,
        creditLimit: value.creditLimit ?? undefined,
        paymentTermsDays: value.paymentTermsDays,
        preferredSupplier: value.preferredSupplier,
        isActive: value.isActive,
      })
      .subscribe({
        next: (supplier) => {
          this.version.set(supplier.version);
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
    this.supplierService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/party/suppliers']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/party/suppliers']);
  }

  private load(id: string): void {
    this.supplierService.getById(id).subscribe({
      next: (supplier) => {
        this.version.set(supplier.version);
        this.form.patchValue({
          partyId: supplier.partyId,
          supplierCode: supplier.supplierCode,
          supplierType: supplier.supplierType,
          gstin: supplier.gstin ?? '',
          drugLicenseNumber: supplier.drugLicenseNumber ?? '',
          panNumber: supplier.panNumber ?? '',
          creditLimit: supplier.creditLimit,
          paymentTermsDays: supplier.paymentTermsDays,
          preferredSupplier: supplier.preferredSupplier,
          isActive: supplier.isActive,
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
