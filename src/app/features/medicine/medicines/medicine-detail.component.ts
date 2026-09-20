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
import { TabsModule } from 'primeng/tabs';
import { ApiClientError } from '../../../core/models/api-response.types';
import { MedicineSaltsTabComponent } from './medicine-salts-tab.component';
import { MedicineService } from './medicine.service';

@Component({
  selector: 'app-medicine-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    TabsModule,
    MedicineSaltsTabComponent,
  ],
  templateUrl: './medicine-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicineDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly medicineService = inject(MedicineService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly medicineId = signal<string | null>(null);
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  readonly form = this.fb.nonNullable.group({
    medicineCode: ['', Validators.required],
    medicineName: ['', Validators.required],
    manufacturerId: ['', Validators.required],
    categoryId: ['', Validators.required],
    scheduleId: [''],
    unitId: ['', Validators.required],
    brandName: [''],
    strength: [''],
    dosageForm: ['', Validators.required],
    packSize: [''],
    hsnCode: [''],
    barcode: [''],
    requiresPrescription: [false],
    narcoticDrug: [false],
    refrigerated: [false],
    discontinued: [false],
    isActive: [true],
  });

  ngOnInit(): void {
    const medicineId = this.route.snapshot.paramMap.get('medicineId');
    if (medicineId) {
      this.isNew.set(false);
      this.medicineId.set(medicineId);
      this.activeTab.set(
        this.route.snapshot.url.some((segment) => segment.path === 'salts')
          ? 'salts'
          : 'overview',
      );
      this.load(medicineId);
    }
  }

  onTabChange(tab: string | number | undefined): void {
    if (tab === undefined) {
      return;
    }
    const tabValue = String(tab);
    this.activeTab.set(tabValue);
    const id = this.medicineId();
    if (!id) {
      return;
    }
    if (tabValue === 'salts') {
      this.router.navigate(['/medicine/medicines', id, 'salts']);
      return;
    }
    this.router.navigate(['/medicine/medicines', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.medicineService
        .create({
          medicineCode: value.medicineCode,
          medicineName: value.medicineName,
          manufacturerId: value.manufacturerId,
          categoryId: value.categoryId,
          scheduleId: value.scheduleId || undefined,
          unitId: value.unitId,
          brandName: value.brandName || undefined,
          strength: value.strength || undefined,
          dosageForm: value.dosageForm,
          packSize: value.packSize || undefined,
          hsnCode: value.hsnCode || undefined,
          barcode: value.barcode || undefined,
          requiresPrescription: value.requiresPrescription,
          narcoticDrug: value.narcoticDrug,
          refrigerated: value.refrigerated,
          discontinued: value.discontinued,
          isActive: value.isActive,
        })
        .subscribe({
          next: (medicine) => {
            this.saving.set(false);
            this.router.navigate(['/medicine/medicines', medicine.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.medicineService
      .update(this.medicineId()!, {
        version: this.version(),
        medicineName: value.medicineName,
        manufacturerId: value.manufacturerId,
        categoryId: value.categoryId,
        scheduleId: value.scheduleId || null,
        unitId: value.unitId,
        brandName: value.brandName || undefined,
        strength: value.strength || undefined,
        dosageForm: value.dosageForm,
        packSize: value.packSize || undefined,
        hsnCode: value.hsnCode || undefined,
        barcode: value.barcode || undefined,
        requiresPrescription: value.requiresPrescription,
        narcoticDrug: value.narcoticDrug,
        refrigerated: value.refrigerated,
        discontinued: value.discontinued,
        isActive: value.isActive,
      })
      .subscribe({
        next: (medicine) => {
          this.version.set(medicine.version);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  deleteRecord(): void {
    const id = this.medicineId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.medicineService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/medicine/medicines']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/medicine/medicines']);
  }

  private load(id: string): void {
    this.medicineService.getById(id).subscribe({
      next: (medicine) => {
        this.version.set(medicine.version);
        this.form.patchValue({
          medicineCode: medicine.medicineCode,
          medicineName: medicine.medicineName,
          manufacturerId: medicine.manufacturerId,
          categoryId: medicine.categoryId,
          scheduleId: medicine.scheduleId ?? '',
          unitId: medicine.unitId,
          brandName: medicine.brandName ?? '',
          strength: medicine.strength ?? '',
          dosageForm: medicine.dosageForm,
          packSize: medicine.packSize ?? '',
          hsnCode: medicine.hsnCode ?? '',
          barcode: medicine.barcode ?? '',
          requiresPrescription: medicine.requiresPrescription,
          narcoticDrug: medicine.narcoticDrug,
          refrigerated: medicine.refrigerated,
          discontinued: medicine.discontinued,
          isActive: medicine.isActive,
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
