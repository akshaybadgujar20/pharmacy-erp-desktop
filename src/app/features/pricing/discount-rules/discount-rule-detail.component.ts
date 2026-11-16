import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { MedicineCategoryService } from '../../medicine/categories/medicine-category.service';
import { MedicineLookupComponent } from '../../../shared/lookups/medicine-lookup.component';
import {
  dateToEpochMs,
  epochToDate,
  nullableDateToEpochMs,
  optionalDateToEpochMs,
} from '../pricing-date.util';
import {
  DISCOUNT_APPLIES_TO_OPTIONS,
  DISCOUNT_TYPE_OPTIONS,
} from './discount-rule.models';
import { DiscountRuleService } from './discount-rule.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-discount-rule-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    DatePickerModule,
    SelectModule,
    ButtonModule,
    CheckboxModule,
    TranslatePipe,
    MedicineLookupComponent,
  ],
  templateUrl: './discount-rule-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscountRuleDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

  private readonly fb = inject(FormBuilder);
  private readonly discountRuleService = inject(DiscountRuleService);
  private readonly categories = inject(MedicineCategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  private entityId: string | null = null;

  readonly discountTypeOptions = DISCOUNT_TYPE_OPTIONS;
  readonly appliesToOptions = DISCOUNT_APPLIES_TO_OPTIONS;
  readonly categoryOptions = signal<{ label: string; value: string }[]>([]);

  readonly form = this.fb.nonNullable.group({
    ruleCode: ['', Validators.required],
    ruleName: ['', Validators.required],
    discountType: ['PERCENT', Validators.required],
    discountValue: ['', Validators.required],
    appliesTo: ['GLOBAL', Validators.required],
    medicineId: [''],
    categoryId: [''],
    customerId: [''],
    priceListId: [''],
    minimumQuantity: [''],
    minimumAmount: [''],
    priority: [1, Validators.required],
    effectiveFrom: this.fb.control<Date | null>(null, Validators.required),
    effectiveTo: this.fb.control<Date | null>(null),
    isActive: [true],
    remarks: [''],
  });

  ngOnDestroy(): void {
    this.detailShortcutBinding?.unregister();
  }

  ngOnInit(): void {
    this.categories.list({ page: '1', pageSize: '100' }).subscribe({
      next: ({ data }) => {
        this.categoryOptions.set(
          data.map((category) => ({
            label: category.categoryName,
            value: category.id,
          })),
        );
      },
    });

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
      this.discountRuleService
        .create({
          ruleCode: value.ruleCode,
          ruleName: value.ruleName,
          discountType: value.discountType,
          discountValue: value.discountValue,
          appliesTo: value.appliesTo,
          medicineId: value.medicineId || undefined,
          categoryId: value.categoryId || undefined,
          customerId: value.customerId || undefined,
          priceListId: value.priceListId || undefined,
          minimumQuantity: value.minimumQuantity || undefined,
          minimumAmount: value.minimumAmount || undefined,
          priority: value.priority,
          effectiveFrom: dateToEpochMs(value.effectiveFrom),
          effectiveTo: optionalDateToEpochMs(value.effectiveTo),
          isActive: value.isActive,
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (discountRule) => {
            this.saving.set(false);
            this.router.navigate(['/pricing/discount-rules', discountRule.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.discountRuleService
      .update(this.entityId!, {
        version: this.version(),
        ruleCode: value.ruleCode,
        ruleName: value.ruleName,
        discountType: value.discountType,
        discountValue: value.discountValue,
        appliesTo: value.appliesTo,
        medicineId: value.medicineId || null,
        categoryId: value.categoryId || null,
        customerId: value.customerId || null,
        priceListId: value.priceListId || null,
        minimumQuantity: value.minimumQuantity || undefined,
        minimumAmount: value.minimumAmount || undefined,
        priority: value.priority,
        effectiveFrom: optionalDateToEpochMs(value.effectiveFrom),
        effectiveTo: nullableDateToEpochMs(value.effectiveTo),
        isActive: value.isActive,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (discountRule) => {
          this.version.set(discountRule.version);
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
    this.discountRuleService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/pricing/discount-rules']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/pricing/discount-rules']);
  }

  private load(id: string): void {
    this.discountRuleService.getById(id).subscribe({
      next: (discountRule) => {
        this.version.set(discountRule.version);
        this.form.patchValue({
          ruleCode: discountRule.ruleCode,
          ruleName: discountRule.ruleName,
          discountType: discountRule.discountType,
          discountValue: discountRule.discountValue,
          appliesTo: discountRule.appliesTo,
          medicineId: discountRule.medicineId ?? '',
          categoryId: discountRule.categoryId ?? '',
          customerId: discountRule.customerId ?? '',
          priceListId: discountRule.priceListId ?? '',
          minimumQuantity: discountRule.minimumQuantity ?? '',
          minimumAmount: discountRule.minimumAmount ?? '',
          priority: discountRule.priority,
          effectiveFrom: epochToDate(discountRule.effectiveFrom),
          effectiveTo: epochToDate(discountRule.effectiveTo),
          isActive: discountRule.isActive,
          remarks: discountRule.remarks ?? '',
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
