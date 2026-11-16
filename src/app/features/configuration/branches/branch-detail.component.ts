import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { epochToDate, optionalDateToEpochMs } from '../configuration-date.util';
import { BranchService } from './branch.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-branch-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,
    ReactiveFormsModule,
    InputTextModule,
    DatePickerModule,
    ButtonModule,
    CheckboxModule,
    TranslatePipe,
  ],
  templateUrl: './branch-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

  private readonly fb = inject(FormBuilder);
  private readonly branchService = inject(BranchService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    branchCode: ['', Validators.required],
    branchName: ['', Validators.required],
    displayName: ['', Validators.required],
    gstNumber: [''],
    drugLicenseNumber: [''],
    email: [''],
    phoneNumber: [''],
    addressLine1: [''],
    addressLine2: [''],
    city: [''],
    state: [''],
    country: [''],
    pinCode: [''],
    managerName: [''],
    openingDate: this.fb.control<Date | null>(null),
    isHeadOffice: [false],
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
      this.branchService
        .create({
          branchCode: value.branchCode,
          branchName: value.branchName,
          displayName: value.displayName,
          gstNumber: value.gstNumber || undefined,
          drugLicenseNumber: value.drugLicenseNumber || undefined,
          email: value.email || undefined,
          phoneNumber: value.phoneNumber || undefined,
          addressLine1: value.addressLine1 || undefined,
          addressLine2: value.addressLine2 || undefined,
          city: value.city || undefined,
          state: value.state || undefined,
          country: value.country || undefined,
          pinCode: value.pinCode || undefined,
          managerName: value.managerName || undefined,
          openingDate: optionalDateToEpochMs(value.openingDate),
          isHeadOffice: value.isHeadOffice,
          isActive: value.isActive,
        })
        .subscribe({
          next: (branch) => {
            this.saving.set(false);
            this.router.navigate(['/configuration/branches', branch.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.branchService
      .update(this.entityId!, {
        version: this.version(),
        branchCode: value.branchCode,
        branchName: value.branchName,
        displayName: value.displayName,
        gstNumber: value.gstNumber || undefined,
        drugLicenseNumber: value.drugLicenseNumber || undefined,
        email: value.email || undefined,
        phoneNumber: value.phoneNumber || undefined,
        addressLine1: value.addressLine1 || undefined,
        addressLine2: value.addressLine2 || undefined,
        city: value.city || undefined,
        state: value.state || undefined,
        country: value.country || undefined,
        pinCode: value.pinCode || undefined,
        managerName: value.managerName || undefined,
        openingDate: optionalDateToEpochMs(value.openingDate),
        isHeadOffice: value.isHeadOffice,
        isActive: value.isActive,
      })
      .subscribe({
        next: (branch) => {
          this.version.set(branch.version);
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
    this.branchService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/configuration/branches']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/configuration/branches']);
  }

  private load(id: string): void {
    this.branchService.getById(id).subscribe({
      next: (branch) => {
        this.version.set(branch.version);
        this.form.patchValue({
          branchCode: branch.branchCode,
          branchName: branch.branchName,
          displayName: branch.displayName,
          gstNumber: branch.gstNumber ?? '',
          drugLicenseNumber: branch.drugLicenseNumber ?? '',
          email: branch.email ?? '',
          phoneNumber: branch.phoneNumber ?? '',
          addressLine1: branch.addressLine1 ?? '',
          addressLine2: branch.addressLine2 ?? '',
          city: branch.city ?? '',
          state: branch.state ?? '',
          country: branch.country ?? '',
          pinCode: branch.pinCode ?? '',
          managerName: branch.managerName ?? '',
          openingDate: epochToDate(branch.openingDate),
          isHeadOffice: branch.isHeadOffice,
          isActive: branch.isActive,
        });
      },
      error: (error) => this.handleError(error),
    });
  }

  private handleError(error: unknown): void {
    this.saving.set(false);
    this.errorMessage.set(resolveApiErrorMessage(error));
  }
}
