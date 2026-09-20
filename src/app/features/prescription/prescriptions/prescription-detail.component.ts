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
import { TabsModule } from 'primeng/tabs';
import { ApiClientError } from '../../../core/models/api-response.types';
import {
  nullableEpochMs,
  optionalEpochMs,
  toEpochMs,
} from '../prescription-date.util';
import { PrescriptionItemsTabComponent } from './prescription-items-tab.component';
import { PrescriptionService } from './prescription.service';

@Component({
  selector: 'app-prescription-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    TabsModule,
    PrescriptionItemsTabComponent,
  ],
  templateUrl: './prescription-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrescriptionDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly prescriptionService = inject(PrescriptionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly prescriptionId = signal<string | null>(null);
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly workflowInProgress = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');
  readonly status = signal('DRAFT');

  readonly form = this.fb.nonNullable.group({
    prescriptionNumber: ['', Validators.required],
    customerId: ['', Validators.required],
    doctorId: ['', Validators.required],
    prescriptionDate: ['', Validators.required],
    validUntil: [''],
    diagnosis: [''],
    symptoms: [''],
    visitNumber: [''],
    remarks: [''],
  });

  ngOnInit(): void {
    const prescriptionId = this.route.snapshot.paramMap.get('prescriptionId');
    if (prescriptionId) {
      this.isNew.set(false);
      this.prescriptionId.set(prescriptionId);
      this.activeTab.set(
        this.route.snapshot.url.some((segment) => segment.path === 'items')
          ? 'items'
          : 'overview',
      );
      this.load(prescriptionId);
      return;
    }
    this.form.patchValue({
      prescriptionDate: new Date().toISOString(),
    });
  }

  onTabChange(tab: string | number | undefined): void {
    if (tab === undefined) {
      return;
    }
    const tabValue = String(tab);
    this.activeTab.set(tabValue);
    const id = this.prescriptionId();
    if (!id) {
      return;
    }
    if (tabValue === 'items') {
      this.router.navigate(['/prescriptions', id, 'items']);
      return;
    }
    this.router.navigate(['/prescriptions', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.prescriptionService
        .create({
          prescriptionNumber: value.prescriptionNumber,
          customerId: value.customerId,
          doctorId: value.doctorId,
          prescriptionDate: toEpochMs(value.prescriptionDate),
          validUntil: optionalEpochMs(value.validUntil),
          diagnosis: value.diagnosis || undefined,
          symptoms: value.symptoms || undefined,
          visitNumber: value.visitNumber || undefined,
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (prescription) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.prescriptionId.set(prescription.id);
            this.version.set(prescription.version);
            this.status.set(prescription.status);
            this.router.navigate(['/prescriptions', prescription.id], {
              replaceUrl: true,
            });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.prescriptionService
      .update(this.prescriptionId()!, {
        version: this.version(),
        prescriptionNumber: value.prescriptionNumber,
        customerId: value.customerId,
        doctorId: value.doctorId,
        prescriptionDate: optionalEpochMs(value.prescriptionDate),
        validUntil: nullableEpochMs(value.validUntil),
        diagnosis: value.diagnosis || undefined,
        symptoms: value.symptoms || undefined,
        visitNumber: value.visitNumber || undefined,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (prescription) => {
          this.version.set(prescription.version);
          this.status.set(prescription.status);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  activatePrescription(): void {
    const id = this.prescriptionId();
    if (!id) {
      return;
    }

    this.workflowInProgress.set(true);
    this.errorMessage.set('');
    this.prescriptionService
      .activate(id, { version: this.version() })
      .subscribe({
        next: (prescription) => {
          this.version.set(prescription.version);
          this.status.set(prescription.status);
          this.workflowInProgress.set(false);
        },
        error: (error) => {
          this.workflowInProgress.set(false);
          this.handleError(error);
        },
      });
  }

  cancelPrescription(): void {
    const id = this.prescriptionId();
    if (!id) {
      return;
    }

    this.workflowInProgress.set(true);
    this.errorMessage.set('');
    this.prescriptionService
      .cancel(id, { version: this.version() })
      .subscribe({
        next: (prescription) => {
          this.version.set(prescription.version);
          this.status.set(prescription.status);
          this.workflowInProgress.set(false);
        },
        error: (error) => {
          this.workflowInProgress.set(false);
          this.handleError(error);
        },
      });
  }

  expirePrescription(): void {
    const id = this.prescriptionId();
    if (!id) {
      return;
    }

    this.workflowInProgress.set(true);
    this.errorMessage.set('');
    this.prescriptionService
      .expire(id, { version: this.version() })
      .subscribe({
        next: (prescription) => {
          this.version.set(prescription.version);
          this.status.set(prescription.status);
          this.workflowInProgress.set(false);
        },
        error: (error) => {
          this.workflowInProgress.set(false);
          this.handleError(error);
        },
      });
  }

  deleteRecord(): void {
    const id = this.prescriptionId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.prescriptionService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/prescriptions']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/prescriptions']);
  }

  private load(id: string): void {
    this.prescriptionService.getById(id).subscribe({
      next: (prescription) => {
        this.version.set(prescription.version);
        this.status.set(prescription.status);
        this.form.patchValue({
          prescriptionNumber: prescription.prescriptionNumber,
          customerId: prescription.customerId,
          doctorId: prescription.doctorId,
          prescriptionDate: prescription.prescriptionDate,
          validUntil: prescription.validUntil ?? '',
          diagnosis: prescription.diagnosis ?? '',
          symptoms: prescription.symptoms ?? '',
          visitNumber: prescription.visitNumber ?? '',
          remarks: prescription.remarks ?? '',
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
