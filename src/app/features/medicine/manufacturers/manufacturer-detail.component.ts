import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PartyLookupComponent } from '../../../shared/lookups/party-lookup.component';
import { ManufacturerService } from './manufacturer.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-manufacturer-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    TranslatePipe,
    PartyLookupComponent,
  ],
  templateUrl: './manufacturer-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManufacturerDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

  private readonly fb = inject(FormBuilder);
  private readonly manufacturerService = inject(ManufacturerService);
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
    manufacturerCode: ['', Validators.required],
    manufacturingLicenseNo: [''],
    gstin: [''],
    website: [''],
    email: [''],
    supportPhone: [''],
    isPreferred: [false],
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
      this.manufacturerService
        .create({
          partyId: value.partyId,
          manufacturerCode: value.manufacturerCode,
          manufacturingLicenseNo: value.manufacturingLicenseNo || undefined,
          gstin: value.gstin || undefined,
          website: value.website || undefined,
          email: value.email || undefined,
          supportPhone: value.supportPhone || undefined,
          isPreferred: value.isPreferred,
          isActive: value.isActive,
        })
        .subscribe({
          next: (manufacturer) => {
            this.saving.set(false);
            this.router.navigate(['/medicine/manufacturers', manufacturer.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.manufacturerService
      .update(this.entityId!, {
        version: this.version(),
        manufacturerCode: value.manufacturerCode,
        manufacturingLicenseNo: value.manufacturingLicenseNo || undefined,
        gstin: value.gstin || undefined,
        website: value.website || undefined,
        email: value.email || undefined,
        supportPhone: value.supportPhone || undefined,
        isPreferred: value.isPreferred,
        isActive: value.isActive,
      })
      .subscribe({
        next: (manufacturer) => {
          this.version.set(manufacturer.version);
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
    this.manufacturerService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/medicine/manufacturers']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/medicine/manufacturers']);
  }

  private load(id: string): void {
    this.manufacturerService.getById(id).subscribe({
      next: (manufacturer) => {
        this.version.set(manufacturer.version);
        this.form.patchValue({
          partyId: manufacturer.partyId,
          manufacturerCode: manufacturer.manufacturerCode,
          manufacturingLicenseNo: manufacturer.manufacturingLicenseNo ?? '',
          gstin: manufacturer.gstin ?? '',
          website: manufacturer.website ?? '',
          email: manufacturer.email ?? '',
          supportPhone: manufacturer.supportPhone ?? '',
          isPreferred: manufacturer.isPreferred,
          isActive: manufacturer.isActive,
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
