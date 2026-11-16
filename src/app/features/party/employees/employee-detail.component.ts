import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PartyLookupComponent } from '../../../shared/lookups/party-lookup.component';
import { EmployeeService } from './employee.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    CheckboxModule,
    TranslatePipe,
    PartyLookupComponent,
  ],
  templateUrl: './employee-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
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
    employeeCode: ['', Validators.required],
    designation: [''],
    department: [''],
    salary: [null as number | null],
    licenseNumber: [''],
    isPharmacist: [false],
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
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.employeeService
        .create({
          partyId: value.partyId,
          employeeCode: value.employeeCode,
          designation: value.designation || undefined,
          department: value.department || undefined,
          salary: value.salary ?? undefined,
          licenseNumber: value.licenseNumber || undefined,
          isPharmacist: value.isPharmacist,
          isActive: value.isActive,
        })
        .subscribe({
          next: (employee) => {
            this.saving.set(false);
            this.router.navigate(['/party/employees', employee.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.employeeService
      .update(this.entityId!, {
        version: this.version(),
        employeeCode: value.employeeCode,
        designation: value.designation || undefined,
        department: value.department || undefined,
        salary: value.salary ?? undefined,
        licenseNumber: value.licenseNumber || undefined,
        isPharmacist: value.isPharmacist,
        isActive: value.isActive,
      })
      .subscribe({
        next: (employee) => {
          this.version.set(employee.version);
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
    this.employeeService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/party/employees']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/party/employees']);
  }

  private load(id: string): void {
    this.employeeService.getById(id).subscribe({
      next: (employee) => {
        this.version.set(employee.version);
        this.form.patchValue({
          partyId: employee.partyId,
          employeeCode: employee.employeeCode,
          designation: employee.designation ?? '',
          department: employee.department ?? '',
          salary: employee.salary,
          licenseNumber: employee.licenseNumber ?? '',
          isPharmacist: employee.isPharmacist,
          isActive: employee.isActive,
        });
        this.form.controls.partyId.disable();
      },
      error: (error) => this.handleError(error),
    });
  }

  private handleError(error: unknown): void {
    this.saving.set(false);
    this.errorMessage.set(resolveApiErrorMessage(error));
  }
}
