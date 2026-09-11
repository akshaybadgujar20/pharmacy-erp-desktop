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
import { DoctorService } from './doctor.service';

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './doctor-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly doctorService = inject(DoctorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    partyId: ['', Validators.required],
    doctorCode: ['', Validators.required],
    registrationNumber: ['', Validators.required],
    qualification: [''],
    specialization: [''],
    hospitalName: [''],
    consultationFee: [null as number | null],
    isVisitingDoctor: [false],
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
      this.doctorService
        .create({
          partyId: value.partyId,
          doctorCode: value.doctorCode,
          registrationNumber: value.registrationNumber,
          qualification: value.qualification || undefined,
          specialization: value.specialization || undefined,
          hospitalName: value.hospitalName || undefined,
          consultationFee: value.consultationFee ?? undefined,
          isVisitingDoctor: value.isVisitingDoctor,
          isActive: value.isActive,
        })
        .subscribe({
          next: (doctor) => {
            this.saving.set(false);
            this.router.navigate(['/party/doctors', doctor.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.doctorService
      .update(this.entityId!, {
        version: this.version(),
        doctorCode: value.doctorCode,
        registrationNumber: value.registrationNumber,
        qualification: value.qualification || undefined,
        specialization: value.specialization || undefined,
        hospitalName: value.hospitalName || undefined,
        consultationFee: value.consultationFee ?? undefined,
        isVisitingDoctor: value.isVisitingDoctor,
        isActive: value.isActive,
      })
      .subscribe({
        next: (doctor) => {
          this.version.set(doctor.version);
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
    this.doctorService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/party/doctors']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/party/doctors']);
  }

  private load(id: string): void {
    this.doctorService.getById(id).subscribe({
      next: (doctor) => {
        this.version.set(doctor.version);
        this.form.patchValue({
          partyId: doctor.partyId,
          doctorCode: doctor.doctorCode,
          registrationNumber: doctor.registrationNumber,
          qualification: doctor.qualification ?? '',
          specialization: doctor.specialization ?? '',
          hospitalName: doctor.hospitalName ?? '',
          consultationFee: doctor.consultationFee,
          isVisitingDoctor: doctor.isVisitingDoctor,
          isActive: doctor.isActive,
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
