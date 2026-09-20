import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { ApiClientError } from '../../../core/models/api-response.types';
import {
  nullableEpochMs,
  optionalEpochMs,
  toEpochMs,
} from '../inventory-date.util';
import { StockTransferItemsTabComponent } from './stock-transfer-items-tab.component';
import { StockTransferService } from './stock-transfer.service';

@Component({
  selector: 'app-stock-transfer-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    TabsModule,
    StockTransferItemsTabComponent,
  ],
  templateUrl: './stock-transfer-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTransferDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly stockTransferService = inject(StockTransferService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly transferId = signal<string | null>(null);
  readonly status = signal('DRAFT');
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly dispatching = signal(false);
  readonly receiving = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  readonly isDraft = computed(() => this.status() === 'DRAFT');
  readonly canDispatch = computed(() => this.status() === 'DRAFT');
  readonly canReceive = computed(() =>
    ['DISPATCHED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED'].includes(this.status()),
  );

  readonly form = this.fb.nonNullable.group({
    sourceBranchId: ['', Validators.required],
    destinationBranchId: ['', Validators.required],
    transferDate: ['', Validators.required],
    transferType: ['ROUTINE_REPLENISHMENT', Validators.required],
    expectedArrivalDate: [''],
    remarks: [''],
  });

  ngOnInit(): void {
    const transferId = this.route.snapshot.paramMap.get('transferId');
    if (transferId) {
      this.isNew.set(false);
      this.transferId.set(transferId);
      this.activeTab.set(
        this.route.snapshot.url.some((segment) => segment.path === 'items')
          ? 'items'
          : 'overview',
      );
      this.load(transferId);
      return;
    }
    this.form.patchValue({
      transferDate: new Date().toISOString(),
    });
  }

  onTabChange(tab: string | number | undefined): void {
    if (tab === undefined) {
      return;
    }
    const tabValue = String(tab);
    this.activeTab.set(tabValue);
    const id = this.transferId();
    if (!id) {
      return;
    }
    if (tabValue === 'items') {
      this.router.navigate(['/inventory/stock-transfers', id, 'items']);
      return;
    }
    this.router.navigate(['/inventory/stock-transfers', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.stockTransferService
        .create({
          sourceBranchId: value.sourceBranchId,
          destinationBranchId: value.destinationBranchId,
          transferDate: toEpochMs(value.transferDate),
          transferType: value.transferType,
          expectedArrivalDate: optionalEpochMs(value.expectedArrivalDate),
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (transfer) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.transferId.set(transfer.id);
            this.status.set(transfer.status);
            this.version.set(transfer.version);
            this.router.navigate(['/inventory/stock-transfers', transfer.id], {
              replaceUrl: true,
            });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.stockTransferService
      .update(this.transferId()!, {
        version: this.version(),
        transferDate: toEpochMs(value.transferDate),
        transferType: value.transferType,
        expectedArrivalDate: nullableEpochMs(value.expectedArrivalDate),
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (transfer) => {
          this.version.set(transfer.version);
          this.status.set(transfer.status);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  dispatch(): void {
    const id = this.transferId();
    if (!id) {
      return;
    }

    this.dispatching.set(true);
    this.errorMessage.set('');
    this.stockTransferService.dispatch(id).subscribe({
      next: (transfer) => {
        this.dispatching.set(false);
        this.status.set(transfer.status);
        this.version.set(transfer.version);
      },
      error: (error) => {
        this.dispatching.set(false);
        this.handleError(error);
      },
    });
  }

  receive(): void {
    const id = this.transferId();
    if (!id) {
      return;
    }

    this.receiving.set(true);
    this.errorMessage.set('');
    this.stockTransferService.receive(id).subscribe({
      next: (transfer) => {
        this.receiving.set(false);
        this.status.set(transfer.status);
        this.version.set(transfer.version);
      },
      error: (error) => {
        this.receiving.set(false);
        this.handleError(error);
      },
    });
  }

  deleteRecord(): void {
    const id = this.transferId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.stockTransferService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/inventory/stock-transfers']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/inventory/stock-transfers']);
  }

  private load(id: string): void {
    this.stockTransferService.getById(id).subscribe({
      next: (transfer) => {
        this.version.set(transfer.version);
        this.status.set(transfer.status);
        this.form.patchValue({
          sourceBranchId: transfer.sourceBranchId,
          destinationBranchId: transfer.destinationBranchId,
          transferDate: transfer.transferDate,
          transferType: transfer.transferType,
          expectedArrivalDate: transfer.expectedArrivalDate ?? '',
          remarks: transfer.remarks ?? '',
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
