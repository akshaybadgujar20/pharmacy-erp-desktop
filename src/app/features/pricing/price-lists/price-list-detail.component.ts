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
import { TabsModule } from 'primeng/tabs';
import { ApiClientError } from '../../../core/models/api-response.types';
import {
  nullableEpochMs,
  optionalEpochMs,
  toEpochMs,
} from '../pricing-date.util';
import { PriceListItemsTabComponent } from './price-list-items-tab.component';
import { PriceListService } from './price-list.service';

@Component({
  selector: 'app-price-list-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    TabsModule,
    PriceListItemsTabComponent,
  ],
  templateUrl: './price-list-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceListDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly priceListService = inject(PriceListService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly priceListId = signal<string | null>(null);
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  readonly form = this.fb.nonNullable.group({
    priceListCode: ['', Validators.required],
    priceListName: ['', Validators.required],
    branchId: [''],
    priceListType: ['RETAIL', Validators.required],
    effectiveFrom: ['', Validators.required],
    effectiveTo: [''],
    isDefault: [false],
    isActive: [true],
    remarks: [''],
  });

  ngOnInit(): void {
    const priceListId = this.route.snapshot.paramMap.get('priceListId');
    if (priceListId) {
      this.isNew.set(false);
      this.priceListId.set(priceListId);
      this.activeTab.set(
        this.route.snapshot.url.some((segment) => segment.path === 'items')
          ? 'items'
          : 'overview',
      );
      this.load(priceListId);
      return;
    }
    this.form.patchValue({
      effectiveFrom: new Date().toISOString(),
    });
  }

  onTabChange(tab: string | number | undefined): void {
    if (tab === undefined) {
      return;
    }
    const tabValue = String(tab);
    this.activeTab.set(tabValue);
    const id = this.priceListId();
    if (!id) {
      return;
    }
    if (tabValue === 'items') {
      this.router.navigate(['/pricing/price-lists', id, 'items']);
      return;
    }
    this.router.navigate(['/pricing/price-lists', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.priceListService
        .create({
          priceListCode: value.priceListCode,
          priceListName: value.priceListName,
          branchId: value.branchId || undefined,
          priceListType: value.priceListType,
          effectiveFrom: toEpochMs(value.effectiveFrom),
          effectiveTo: optionalEpochMs(value.effectiveTo),
          isDefault: value.isDefault,
          isActive: value.isActive,
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (priceList) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.priceListId.set(priceList.id);
            this.version.set(priceList.version);
            this.router.navigate(['/pricing/price-lists', priceList.id], {
              replaceUrl: true,
            });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.priceListService
      .update(this.priceListId()!, {
        version: this.version(),
        priceListCode: value.priceListCode,
        priceListName: value.priceListName,
        branchId: value.branchId || null,
        priceListType: value.priceListType,
        effectiveFrom: optionalEpochMs(value.effectiveFrom),
        effectiveTo: nullableEpochMs(value.effectiveTo),
        isDefault: value.isDefault,
        isActive: value.isActive,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (priceList) => {
          this.version.set(priceList.version);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  deleteRecord(): void {
    const id = this.priceListId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.priceListService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/pricing/price-lists']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/pricing/price-lists']);
  }

  private load(id: string): void {
    this.priceListService.getById(id).subscribe({
      next: (priceList) => {
        this.version.set(priceList.version);
        this.form.patchValue({
          priceListCode: priceList.priceListCode,
          priceListName: priceList.priceListName,
          branchId: priceList.branchId ?? '',
          priceListType: priceList.priceListType,
          effectiveFrom: priceList.effectiveFrom,
          effectiveTo: priceList.effectiveTo ?? '',
          isDefault: priceList.isDefault,
          isActive: priceList.isActive,
          remarks: priceList.remarks ?? '',
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
