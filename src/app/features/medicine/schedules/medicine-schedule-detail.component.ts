import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ApiClientError } from '../../../core/models/api-response.types';
import { MedicineScheduleService } from './medicine-schedule.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-medicine-schedule-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './medicine-schedule-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicineScheduleDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

  private readonly fb = inject(FormBuilder);
  private readonly scheduleService = inject(MedicineScheduleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    scheduleCode: ['', Validators.required],
    scheduleName: ['', Validators.required],
    description: [''],
    requiresPrescription: [false],
    requiresDoctorDetails: [false],
    maintainSalesRegister: [false],
    controlledSubstance: [false],
    isSystemSchedule: [false],
    isActive: [true],
  });

  ngOnDestroy(): void {
    this.detailShortcutBinding?.unregister();
  }

  ngOnInit(): void {
    this.detailShortcutBinding = bindDetailScreenShortcuts(
      this.shortcuts,
      this.activeSave,
      this.activePrint,
      {
        save: () => this.save(),
        delete: () => this.deleteRecord(),
        cancel: () => this.goBack(),
      },
    );

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
      this.scheduleService
        .create({
          scheduleCode: value.scheduleCode,
          scheduleName: value.scheduleName,
          description: value.description || undefined,
          requiresPrescription: value.requiresPrescription,
          requiresDoctorDetails: value.requiresDoctorDetails,
          maintainSalesRegister: value.maintainSalesRegister,
          controlledSubstance: value.controlledSubstance,
          isSystemSchedule: value.isSystemSchedule,
          isActive: value.isActive,
        })
        .subscribe({
          next: (schedule) => {
            this.saving.set(false);
            this.router.navigate(['/medicine/schedules', schedule.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.scheduleService
      .update(this.entityId!, {
        version: this.version(),
        scheduleCode: value.scheduleCode,
        scheduleName: value.scheduleName,
        description: value.description || undefined,
        requiresPrescription: value.requiresPrescription,
        requiresDoctorDetails: value.requiresDoctorDetails,
        maintainSalesRegister: value.maintainSalesRegister,
        controlledSubstance: value.controlledSubstance,
        isSystemSchedule: value.isSystemSchedule,
        isActive: value.isActive,
      })
      .subscribe({
        next: (schedule) => {
          this.version.set(schedule.version);
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
    this.scheduleService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/medicine/schedules']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/medicine/schedules']);
  }

  private load(id: string): void {
    this.scheduleService.getById(id).subscribe({
      next: (schedule) => {
        this.version.set(schedule.version);
        this.form.patchValue({
          scheduleCode: schedule.scheduleCode,
          scheduleName: schedule.scheduleName,
          description: schedule.description ?? '',
          requiresPrescription: schedule.requiresPrescription,
          requiresDoctorDetails: schedule.requiresDoctorDetails,
          maintainSalesRegister: schedule.maintainSalesRegister,
          controlledSubstance: schedule.controlledSubstance,
          isSystemSchedule: schedule.isSystemSchedule,
          isActive: schedule.isActive,
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
