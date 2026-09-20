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
import { toEpochMs } from '../inventory-date.util';
import { StockTakeItemsTabComponent } from './stock-take-items-tab.component';
import { StockTakeService } from './stock-take.service';

@Component({
  selector: 'app-stock-take-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    TabsModule,
    StockTakeItemsTabComponent,
  ],
  templateUrl: './stock-take-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTakeDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly stockTakeService = inject(StockTakeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly stockTakeId = signal<string | null>(null);
  readonly status = signal('DRAFT');
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly starting = signal(false);
  readonly completing = signal(false);
  readonly reconciling = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  readonly isDraft = computed(() => this.status() === 'DRAFT');
  readonly canStart = computed(() => this.status() === 'DRAFT');
  readonly canComplete = computed(() => this.status() === 'IN_PROGRESS');
  readonly canReconcile = computed(() => this.status() === 'COUNTED');
  readonly canEditHeader = computed(() => this.status() === 'DRAFT');

  readonly form = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    stockTakeDate: ['', Validators.required],
    countType: ['FULL_AUDIT', Validators.required],
    countedByEmployeeId: ['', Validators.required],
    remarks: [''],
  });

  ngOnInit(): void {
    const stockTakeId = this.route.snapshot.paramMap.get('stockTakeId');
    if (stockTakeId) {
      this.isNew.set(false);
      this.stockTakeId.set(stockTakeId);
      this.activeTab.set(
        this.route.snapshot.url.some((segment) => segment.path === 'items')
          ? 'items'
          : 'overview',
      );
      this.load(stockTakeId);
      return;
    }
    this.form.patchValue({
      stockTakeDate: new Date().toISOString(),
    });
  }

  onTabChange(tab: string | number | undefined): void {
    if (tab === undefined) {
      return;
    }
    const tabValue = String(tab);
    this.activeTab.set(tabValue);
    const id = this.stockTakeId();
    if (!id) {
      return;
    }
    if (tabValue === 'items') {
      this.router.navigate(['/inventory/stock-takes', id, 'items']);
      return;
    }
    this.router.navigate(['/inventory/stock-takes', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.stockTakeService
        .create({
          branchId: value.branchId,
          stockTakeDate: toEpochMs(value.stockTakeDate),
          countType: value.countType,
          countedByEmployeeId: value.countedByEmployeeId,
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (stockTake) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.stockTakeId.set(stockTake.id);
            this.status.set(stockTake.status);
            this.version.set(stockTake.version);
            this.router.navigate(['/inventory/stock-takes', stockTake.id], {
              replaceUrl: true,
            });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.stockTakeService
      .update(this.stockTakeId()!, {
        version: this.version(),
        stockTakeDate: toEpochMs(value.stockTakeDate),
        countType: value.countType,
        countedByEmployeeId: value.countedByEmployeeId,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (stockTake) => {
          this.version.set(stockTake.version);
          this.status.set(stockTake.status);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  start(): void {
    const id = this.stockTakeId();
    if (!id) {
      return;
    }

    this.starting.set(true);
    this.errorMessage.set('');
    this.stockTakeService.start(id).subscribe({
      next: (stockTake) => {
        this.starting.set(false);
        this.status.set(stockTake.status);
        this.version.set(stockTake.version);
      },
      error: (error) => {
        this.starting.set(false);
        this.handleError(error);
      },
    });
  }

  complete(): void {
    const id = this.stockTakeId();
    if (!id) {
      return;
    }

    this.completing.set(true);
    this.errorMessage.set('');
    this.stockTakeService.complete(id).subscribe({
      next: (stockTake) => {
        this.completing.set(false);
        this.status.set(stockTake.status);
        this.version.set(stockTake.version);
      },
      error: (error) => {
        this.completing.set(false);
        this.handleError(error);
      },
    });
  }

  reconcile(): void {
    const id = this.stockTakeId();
    if (!id) {
      return;
    }

    this.reconciling.set(true);
    this.errorMessage.set('');
    this.stockTakeService.reconcile(id).subscribe({
      next: (stockTake) => {
        this.reconciling.set(false);
        this.status.set(stockTake.status);
        this.version.set(stockTake.version);
      },
      error: (error) => {
        this.reconciling.set(false);
        this.handleError(error);
      },
    });
  }

  deleteRecord(): void {
    const id = this.stockTakeId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.stockTakeService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/inventory/stock-takes']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/inventory/stock-takes']);
  }

  private load(id: string): void {
    this.stockTakeService.getById(id).subscribe({
      next: (stockTake) => {
        this.version.set(stockTake.version);
        this.status.set(stockTake.status);
        this.form.patchValue({
          branchId: stockTake.branchId,
          stockTakeDate: stockTake.stockTakeDate,
          countType: stockTake.countType,
          countedByEmployeeId: stockTake.countedByEmployeeId,
          remarks: stockTake.remarks ?? '',
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
