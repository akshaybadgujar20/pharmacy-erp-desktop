import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { TranslatePipe } from '@ngx-translate/core';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
import { BranchSelectComponent } from '../../../shared/lookups/branch-select.component';
import {
  dateToEpochMs,
  epochToDate,
  nullableDateToEpochMs,
  optionalDateToEpochMs,
} from '../pricing-date.util';
import { PRICE_LIST_TYPE_OPTIONS } from './price-list.models';
import { PriceListItemsTabComponent } from './price-list-items-tab.component';
import { PriceListService } from './price-list.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-price-list-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    TabsModule,
    SelectModule,
    TextareaModule,
    DatePickerModule,
    TranslatePipe,
    BranchSelectComponent,
    PriceListItemsTabComponent,
  ],
  templateUrl: './price-list-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceListDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

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
  readonly priceListTypeOptions = [...PRICE_LIST_TYPE_OPTIONS];

  readonly form = this.fb.nonNullable.group({
    priceListCode: ['', Validators.required],
    priceListName: ['', Validators.required],
    branchId: [''],
    priceListType: ['RETAIL', Validators.required],
    effectiveFrom: this.fb.control<Date | null>(null, Validators.required),
    effectiveTo: this.fb.control<Date | null>(null),
    isDefault: [false],
    isActive: [true],
    remarks: [''],
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
      effectiveFrom: new Date(),
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
      this.form.markAllAsTouched();
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
          effectiveFrom: dateToEpochMs(value.effectiveFrom),
          effectiveTo: optionalDateToEpochMs(value.effectiveTo),
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
        effectiveFrom: optionalDateToEpochMs(value.effectiveFrom),
        effectiveTo: nullableDateToEpochMs(value.effectiveTo),
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
          effectiveFrom: epochToDate(priceList.effectiveFrom),
          effectiveTo: epochToDate(priceList.effectiveTo),
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
    this.deleting.set(false);
    this.errorMessage.set(resolveApiErrorMessage(error));
  }
}
