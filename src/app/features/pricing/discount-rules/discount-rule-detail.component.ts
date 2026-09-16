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
import {
  nullableEpochMs,
  optionalEpochMs,
  toEpochMs,
} from '../pricing-date.util';
import { DiscountRuleService } from './discount-rule.service';

@Component({
  selector: 'app-discount-rule-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './discount-rule-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscountRuleDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly discountRuleService = inject(DiscountRuleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);

  private entityId: string | null = null;

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
    effectiveFrom: ['', Validators.required],
    effectiveTo: [''],
    isActive: [true],
    remarks: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isNew.set(false);
      this.entityId = id;
      this.load(id);
      return;
    }
    this.form.patchValue({
      effectiveFrom: new Date().toISOString(),
    });
  }

  save(): void {
    if (this.form.invalid) {
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
          effectiveFrom: toEpochMs(value.effectiveFrom),
          effectiveTo: optionalEpochMs(value.effectiveTo),
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
        effectiveFrom: optionalEpochMs(value.effectiveFrom),
        effectiveTo: nullableEpochMs(value.effectiveTo),
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
          effectiveFrom: discountRule.effectiveFrom,
          effectiveTo: discountRule.effectiveTo ?? '',
          isActive: discountRule.isActive,
          remarks: discountRule.remarks ?? '',
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
