import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { CompanyService } from './company.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    TranslatePipe,
  ],
  templateUrl: './company-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

  private readonly fb = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    companyCode: ['', Validators.required],
    companyName: ['', Validators.required],
    displayName: ['', Validators.required],
    gstNumber: [''],
    panNumber: [''],
    drugLicenseNumber: [''],
    email: [''],
    phoneNumber: [''],
    website: [''],
    logoPath: [''],
    addressLine1: [''],
    addressLine2: [''],
    city: [''],
    state: [''],
    country: [''],
    pinCode: [''],
    isDefault: [false],
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
      this.companyService
        .create({
          companyCode: value.companyCode,
          companyName: value.companyName,
          displayName: value.displayName,
          gstNumber: value.gstNumber || undefined,
          panNumber: value.panNumber || undefined,
          drugLicenseNumber: value.drugLicenseNumber || undefined,
          email: value.email || undefined,
          phoneNumber: value.phoneNumber || undefined,
          website: value.website || undefined,
          logoPath: value.logoPath || undefined,
          addressLine1: value.addressLine1 || undefined,
          addressLine2: value.addressLine2 || undefined,
          city: value.city || undefined,
          state: value.state || undefined,
          country: value.country || undefined,
          pinCode: value.pinCode || undefined,
          isDefault: value.isDefault,
          isActive: value.isActive,
        })
        .subscribe({
          next: (company) => {
            this.saving.set(false);
            this.router.navigate(['/configuration/companies', company.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.companyService
      .update(this.entityId!, {
        version: this.version(),
        companyCode: value.companyCode,
        companyName: value.companyName,
        displayName: value.displayName,
        gstNumber: value.gstNumber || undefined,
        panNumber: value.panNumber || undefined,
        drugLicenseNumber: value.drugLicenseNumber || undefined,
        email: value.email || undefined,
        phoneNumber: value.phoneNumber || undefined,
        website: value.website || undefined,
        logoPath: value.logoPath || undefined,
        addressLine1: value.addressLine1 || undefined,
        addressLine2: value.addressLine2 || undefined,
        city: value.city || undefined,
        state: value.state || undefined,
        country: value.country || undefined,
        pinCode: value.pinCode || undefined,
        isDefault: value.isDefault,
        isActive: value.isActive,
      })
      .subscribe({
        next: (company) => {
          this.version.set(company.version);
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
    this.companyService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/configuration/companies']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/configuration/companies']);
  }

  private load(id: string): void {
    this.companyService.getById(id).subscribe({
      next: (company) => {
        this.version.set(company.version);
        this.form.patchValue({
          companyCode: company.companyCode,
          companyName: company.companyName,
          displayName: company.displayName,
          gstNumber: company.gstNumber ?? '',
          panNumber: company.panNumber ?? '',
          drugLicenseNumber: company.drugLicenseNumber ?? '',
          email: company.email ?? '',
          phoneNumber: company.phoneNumber ?? '',
          website: company.website ?? '',
          logoPath: company.logoPath ?? '',
          addressLine1: company.addressLine1 ?? '',
          addressLine2: company.addressLine2 ?? '',
          city: company.city ?? '',
          state: company.state ?? '',
          country: company.country ?? '',
          pinCode: company.pinCode ?? '',
          isDefault: company.isDefault,
          isActive: company.isActive,
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
