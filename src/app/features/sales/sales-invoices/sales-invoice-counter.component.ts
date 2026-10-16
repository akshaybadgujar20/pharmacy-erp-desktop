import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { ElectronService } from '../../../core/services/electron.service';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
import { CustomerLookupComponent } from '../../../shared/lookups/customer-lookup.component';
import { PrescriptionLookupComponent } from '../../../shared/lookups/prescription-lookup.component';
import { CustomerLoyaltySummaryService } from './customer-loyalty-summary.service';
import { SalesInvoicePaymentsTabComponent } from './sales-invoice-payments-tab.component';
import { SalesInvoiceItemsTabComponent } from './sales-invoice-items-tab.component';
import { buildSalesReceiptHtml } from './sales-receipt.util';
import { SalesInvoiceService } from './sales-invoice.service';

@Component({
  selector: 'app-sales-invoice-counter',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    DialogModule,
    CustomerLookupComponent,
    PrescriptionLookupComponent,
    SalesInvoiceItemsTabComponent,
    SalesInvoicePaymentsTabComponent,
  ],
  templateUrl: './sales-invoice-counter.component.html',
  styleUrl: './sales-invoice-counter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceCounterComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly salesInvoiceService = inject(SalesInvoiceService);
  private readonly loyaltySummary = inject(CustomerLoyaltySummaryService);
  private readonly electron = inject(ElectronService);
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly invoiceId = signal<string | null>(null);
  readonly version = signal('0');
  readonly status = signal('DRAFT');
  readonly paymentStatus = signal('UNPAID');
  readonly invoiceNumber = signal('');
  readonly netAmount = signal<number | null>(null);
  readonly loyaltyBalance = signal<number | null>(null);
  readonly posting = signal(false);
  readonly postDialogVisible = signal(false);
  readonly redeemPoints = signal(0);
  readonly errorMessage = signal('');
  readonly activeTab = signal<'items' | 'payments'>('items');

  readonly isDraft = computed(() => this.status() === 'DRAFT');
  readonly canPay = computed(() =>
    ['POSTED', 'PARTIALLY_RETURNED'].includes(this.status()),
  );

  readonly form = this.fb.nonNullable.group({
    branchId: [''],
    customerId: [''],
    prescriptionId: [''],
    invoiceDate: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('invoiceId');
    if (!id) {
      this.router.navigate(['/sales/invoices']);
      return;
    }
    this.invoiceId.set(id);
    this.load(id);
    this.shortcuts.registerHandler('sales.payment', () => this.focusPayments());
  }

  ngOnDestroy(): void {
    this.shortcuts.unregisterHandler('sales.payment');
  }

  saveHeader(): void {
    const id = this.invoiceId();
    if (!id || !this.isDraft()) {
      return;
    }
    const value = this.form.getRawValue();
    this.salesInvoiceService
      .update(id, {
        version: this.version(),
        customerId: value.customerId || undefined,
        prescriptionId: value.prescriptionId || undefined,
      })
      .subscribe({
        next: (invoice) => {
          this.version.set(invoice.version);
          this.refreshLoyalty(value.customerId);
        },
        error: (error) => this.errorMessage.set(resolveApiErrorMessage(error)),
      });
  }

  openPostDialog(): void {
    this.postDialogVisible.set(true);
  }

  confirmPost(): void {
    const id = this.invoiceId();
    if (!id) {
      return;
    }
    this.posting.set(true);
    this.errorMessage.set('');
    this.salesInvoiceService
      .post(id, {
        version: this.version(),
        redeemPoints: this.redeemPoints() > 0 ? this.redeemPoints() : undefined,
      })
      .subscribe({
        next: async (invoice) => {
          this.posting.set(false);
          this.postDialogVisible.set(false);
          this.status.set(invoice.status);
          this.paymentStatus.set(invoice.paymentStatus);
          this.invoiceNumber.set(invoice.invoiceNumber);
          this.version.set(invoice.version);
          this.netAmount.set(invoice.netAmount);
          this.activeTab.set('payments');
          await this.electron.printReceipt(buildSalesReceiptHtml(invoice));
        },
        error: (error) => {
          this.posting.set(false);
          this.errorMessage.set(resolveApiErrorMessage(error));
        },
      });
  }

  focusPayments(): void {
    if (this.canPay()) {
      this.activeTab.set('payments');
    }
  }

  private load(id: string): void {
    this.salesInvoiceService.getById(id).subscribe({
      next: (invoice) => {
        this.version.set(invoice.version);
        this.status.set(invoice.status);
        this.paymentStatus.set(invoice.paymentStatus);
        this.invoiceNumber.set(invoice.invoiceNumber);
        this.netAmount.set(invoice.netAmount);
        this.form.patchValue({
          branchId: invoice.branchId,
          customerId: invoice.customerId ?? '',
          prescriptionId: invoice.prescriptionId ?? '',
          invoiceDate: invoice.invoiceDate,
        });
        this.refreshLoyalty(invoice.customerId ?? '');
      },
    });
  }

  private refreshLoyalty(customerId: string): void {
    if (!customerId) {
      this.loyaltyBalance.set(null);
      return;
    }
    this.loyaltySummary.getSummary(customerId).subscribe({
      next: (summary) => this.loyaltyBalance.set(summary.balancePoints),
      error: () => this.loyaltyBalance.set(null),
    });
  }
}
