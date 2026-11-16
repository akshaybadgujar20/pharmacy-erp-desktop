import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import {
  dateToEpochMs,
  epochToDate,
  nullableDateToEpochMs,
  optionalDateToEpochMs,
} from '../pricing-date.util';
import { TAX_TYPE_OPTIONS } from './tax.models';
import { TaxService } from './tax.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-tax-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    SelectModule,
    ButtonModule,
    CheckboxModule,
    TranslatePipe,
  ],
  templateUrl: './tax-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

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

  readonly taxTypeOptions = TAX_TYPE_OPTIONS;

  readonly form = this.fb.nonNullable.group({
    taxCode: ['', Validators.required],
    taxName: ['', Validators.required],
    taxType: ['GST', Validators.required],
    taxRate: ['', Validators.required],
    effectiveFrom: this.fb.control<Date | null>(null, Validators.required),
    effectiveTo: this.fb.control<Date | null>(null),
    isActive: [true],
    description: [''],
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
      return;
    }
    this.form.patchValue({
      effectiveFrom: new Date(),
    });
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
      this.taxService
        .create({
          taxCode: value.taxCode,
          taxName: value.taxName,
          taxType: value.taxType,
          taxRate: value.taxRate,
          effectiveFrom: dateToEpochMs(value.effectiveFrom),
          effectiveTo: optionalDateToEpochMs(value.effectiveTo),
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
        effectiveFrom: optionalDateToEpochMs(value.effectiveFrom),
        effectiveTo: nullableDateToEpochMs(value.effectiveTo),
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
          effectiveFrom: epochToDate(tax.effectiveFrom),
          effectiveTo: epochToDate(tax.effectiveTo),
          isActive: tax.isActive,
          description: tax.description ?? '',
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
