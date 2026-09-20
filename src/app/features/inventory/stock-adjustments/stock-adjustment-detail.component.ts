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
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { ApiClientError } from '../../../core/models/api-response.types';
import { toEpochMs } from '../inventory-date.util';
import { StockAdjustmentItemsTabComponent } from './stock-adjustment-items-tab.component';
import { StockAdjustmentService } from './stock-adjustment.service';

@Component({
  selector: 'app-stock-adjustment-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    TabsModule,
    StockAdjustmentItemsTabComponent,
  ],
  templateUrl: './stock-adjustment-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockAdjustmentDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly stockAdjustmentService = inject(StockAdjustmentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly adjustmentId = signal<string | null>(null);
  readonly status = signal('DRAFT');
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly approving = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  readonly isDraft = computed(() => this.status() === 'DRAFT');

  readonly form = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    adjustmentType: ['DAMAGE', Validators.required],
    adjustmentDate: ['', Validators.required],
    reason: ['', Validators.required],
    isActive: [true],
  });

  ngOnInit(): void {
    const adjustmentId = this.route.snapshot.paramMap.get('adjustmentId');
    if (adjustmentId) {
      this.isNew.set(false);
      this.adjustmentId.set(adjustmentId);
      this.activeTab.set(
        this.route.snapshot.url.some((segment) => segment.path === 'items')
          ? 'items'
          : 'overview',
      );
      this.load(adjustmentId);
      return;
    }
    this.form.patchValue({
      adjustmentDate: new Date().toISOString(),
    });
  }

  onTabChange(tab: string | number | undefined): void {
    if (tab === undefined) {
      return;
    }
    const tabValue = String(tab);
    this.activeTab.set(tabValue);
    const id = this.adjustmentId();
    if (!id) {
      return;
    }
    if (tabValue === 'items') {
      this.router.navigate(['/inventory/stock-adjustments', id, 'items']);
      return;
    }
    this.router.navigate(['/inventory/stock-adjustments', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.stockAdjustmentService
        .create({
          branchId: value.branchId,
          adjustmentType: value.adjustmentType,
          adjustmentDate: toEpochMs(value.adjustmentDate),
          reason: value.reason,
          isActive: value.isActive,
        })
        .subscribe({
          next: (adjustment) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.adjustmentId.set(adjustment.id);
            this.status.set(adjustment.status);
            this.version.set(adjustment.version);
            this.router.navigate(['/inventory/stock-adjustments', adjustment.id], {
              replaceUrl: true,
            });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.stockAdjustmentService
      .update(this.adjustmentId()!, {
        version: this.version(),
        adjustmentType: value.adjustmentType,
        adjustmentDate: toEpochMs(value.adjustmentDate),
        reason: value.reason,
        isActive: value.isActive,
      })
      .subscribe({
        next: (adjustment) => {
          this.version.set(adjustment.version);
          this.status.set(adjustment.status);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  approve(): void {
    const id = this.adjustmentId();
    if (!id) {
      return;
    }

    this.approving.set(true);
    this.errorMessage.set('');
    this.stockAdjustmentService.approve(id).subscribe({
      next: (adjustment) => {
        this.approving.set(false);
        this.status.set(adjustment.status);
        this.version.set(adjustment.version);
      },
      error: (error) => {
        this.approving.set(false);
        this.handleError(error);
      },
    });
  }

  deleteRecord(): void {
    const id = this.adjustmentId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.stockAdjustmentService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/inventory/stock-adjustments']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/inventory/stock-adjustments']);
  }

  private load(id: string): void {
    this.stockAdjustmentService.getById(id).subscribe({
      next: (adjustment) => {
        this.version.set(adjustment.version);
        this.status.set(adjustment.status);
        this.form.patchValue({
          branchId: adjustment.branchId,
          adjustmentType: adjustment.adjustmentType,
          adjustmentDate: adjustment.adjustmentDate,
          reason: adjustment.reason,
          isActive: adjustment.isActive,
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
