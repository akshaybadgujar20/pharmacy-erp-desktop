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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SalesInvoice } from './sales-invoice.models';
import { SalesPrescriptionLinesPanelComponent } from './sales-prescription-lines-panel.component';
import { PrescriptionLineAddEvent } from './sales-prescription-lines-panel.component';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { ElectronService } from '../../../core/services/electron.service';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
import { CustomerLookupComponent } from '../../../shared/lookups/customer-lookup.component';
import { PrescriptionLookupComponent } from '../../../shared/lookups/prescription-lookup.component';
import { CustomerLoyaltySummaryService } from './customer-loyalty-summary.service';
import { SalesInvoicePaymentsTabComponent } from './sales-invoice-payments-tab.component';
import { SalesInvoiceItemsTabComponent } from './sales-invoice-items-tab.component';
import { buildSalesReceiptHtml } from './sales-receipt.util';
import { MedicineService } from '../../medicine/medicines/medicine.service';
import { PrinterConfigurationService } from '../../configuration/printer-configurations/printer-configuration.service';
import { SalesInvoiceService } from './sales-invoice.service';

@Component({
  selector: 'app-sales-invoice-counter',
  standalone: true,
  imports: [
    RouterLink,
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
    SalesPrescriptionLinesPanelComponent,
  ],
  templateUrl: './sales-invoice-counter.component.html',
  styleUrl: './sales-invoice-counter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceCounterComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly salesInvoiceService = inject(SalesInvoiceService);
  private readonly medicineService = inject(MedicineService);
  private readonly printerConfigs = inject(PrinterConfigurationService);
  private defaultReceiptPrinter = '';
  private readonly loyaltySummary = inject(CustomerLoyaltySummaryService);
  private readonly electron = inject(ElectronService);
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private unsubscribeBarcode?: () => void;

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
  readonly scheduleWarning = signal('');
  readonly seedMedicineId = signal<string | null>(null);
  readonly rxPostErrorVisible = signal(false);
  readonly receiptPreviewVisible = signal(false);
  readonly receiptPreviewHtml = signal<SafeHtml>('');
  private pendingInvoice: SalesInvoice | null = null;

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
    this.activeSave.register(() => this.saveHeader());
    this.unsubscribeBarcode = this.electron.onBarcodeScan((code) => this.onBarcodeScan(code));
    this.printerConfigs
      .list({ page: '1', pageSize: '50', documentType: 'RECEIPT' })
      .subscribe({
        next: ({ data }) => {
          const defaultPrinter = data.find((row) => row.isDefault) ?? data[0];
          this.defaultReceiptPrinter = defaultPrinter?.printerName ?? '';
        },
      });
  }

  private onBarcodeScan(code: string): void {
    this.medicineService.list({ search: code, page: '1', pageSize: '1' }).subscribe({
      next: ({ data }) => {
        const medicine = data[0];
        if (!medicine) {
          this.errorMessage.set(`No medicine found for barcode: ${code}`);
          return;
        }
        this.seedMedicineId.set(medicine.id);
        this.activeTab.set('items');
      },
    });
  }

  onAddFromPrescription(event: PrescriptionLineAddEvent): void {
    this.seedMedicineId.set(event.medicineId);
    this.activeTab.set('items');
  }

  ngOnDestroy(): void {
    this.shortcuts.unregisterHandler('sales.payment');
    this.activeSave.unregister();
    this.unsubscribeBarcode?.();
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
        next: (invoice) => {
          this.posting.set(false);
          this.postDialogVisible.set(false);
          this.status.set(invoice.status);
          this.paymentStatus.set(invoice.paymentStatus);
          this.invoiceNumber.set(invoice.invoiceNumber);
          this.version.set(invoice.version);
          this.netAmount.set(invoice.netAmount);
          this.activeTab.set('payments');
          this.pendingInvoice = invoice;
          const html = buildSalesReceiptHtml(invoice);
          this.receiptPreviewHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
          this.receiptPreviewVisible.set(true);
        },
        error: (error) => {
          this.posting.set(false);
          const message = resolveApiErrorMessage(error);
          this.errorMessage.set(message);
          if (message.toLowerCase().includes('prescription')) {
            this.scheduleWarning.set(`${message} — reactivate the prescription and retry.`);
            this.rxPostErrorVisible.set(true);
          }
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
        if (invoice.prescriptionId) {
          this.scheduleWarning.set(
            'Linked prescription — verify Schedule-H compliance before post.',
          );
        }
      },
    });
  }

  async printPreview(): Promise<void> {
    if (!this.pendingInvoice) {
      return;
    }
    await this.electron.printReceipt(buildSalesReceiptHtml(this.pendingInvoice), {
      deviceName: this.defaultReceiptPrinter || undefined,
    });
    this.receiptPreviewVisible.set(false);
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
