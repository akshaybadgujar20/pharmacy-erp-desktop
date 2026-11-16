import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ApiClientError } from '../../../core/models/api-response.types';
import { TabsModule } from 'primeng/tabs';
import { DocumentChangeHistoryPanelComponent } from '../../../shared/audit/document-change-history-panel.component';
import { CustomerLoyaltyTabComponent } from './customer-loyalty-tab.component';
import { CustomerService } from './customer.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    TabsModule,
    CustomerLoyaltyTabComponent,
    DocumentChangeHistoryPanelComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './customer-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');
  readonly customerId = signal<string | null>(null);

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    partyId: ['', Validators.required],
    customerCode: ['', Validators.required],
    customerType: ['RETAIL', Validators.required],
    creditLimit: [null as number | null],
    outstandingAmount: [null as number | null],
    paymentTermsDays: [0],
    isTaxExempt: [false],
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
      this.customerId.set(id);
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
      this.customerService
        .create({
          partyId: value.partyId,
          customerCode: value.customerCode,
          customerType: value.customerType,
          creditLimit: value.creditLimit ?? undefined,
          outstandingAmount: value.outstandingAmount ?? undefined,
          paymentTermsDays: value.paymentTermsDays,
          isTaxExempt: value.isTaxExempt,
          isActive: value.isActive,
        })
        .subscribe({
          next: (customer) => {
            this.saving.set(false);
            this.router.navigate(['/party/customers', customer.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.customerService
      .update(this.entityId!, {
        version: this.version(),
        customerCode: value.customerCode,
        customerType: value.customerType,
        creditLimit: value.creditLimit ?? undefined,
        outstandingAmount: value.outstandingAmount ?? undefined,
        paymentTermsDays: value.paymentTermsDays,
        isTaxExempt: value.isTaxExempt,
        isActive: value.isActive,
      })
      .subscribe({
        next: (customer) => {
          this.version.set(customer.version);
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
    this.customerService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/party/customers']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/party/customers']);
  }

  private load(id: string): void {
    this.customerService.getById(id).subscribe({
      next: (customer) => {
        this.version.set(customer.version);
        this.form.patchValue({
          partyId: customer.partyId,
          customerCode: customer.customerCode,
          customerType: customer.customerType,
          creditLimit: customer.creditLimit,
          outstandingAmount: customer.outstandingAmount,
          paymentTermsDays: customer.paymentTermsDays,
          isTaxExempt: customer.isTaxExempt,
          isActive: customer.isActive,
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
