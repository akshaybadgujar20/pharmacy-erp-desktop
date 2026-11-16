import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { PurchaseOrderService } from '../../features/purchase/purchase-orders/purchase-order.service';
import { LookupOption } from './lookup.types';

@Component({
  selector: 'app-purchase-order-lookup',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PurchaseOrderLookupComponent),
      multi: true,
    },
  ],
  template: `
    <p-autocomplete
      [ngModel]="selected()"
      (ngModelChange)="onSelect($event)"
      [suggestions]="suggestions()"
      (completeMethod)="search($event.query)"
      optionLabel="label"
      [dropdown]="true"
      [forceSelection]="true"
      [disabled]="disabled()"
      placeholder="Search purchase order"
      styleClass="w-full"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderLookupComponent implements ControlValueAccessor {
  private readonly orders = inject(PurchaseOrderService);

  readonly disabled = input(false);

  readonly suggestions = signal<LookupOption[]>([]);
  readonly selected = signal<LookupOption | null>(null);

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    if (!value) {
      this.selected.set(null);
      return;
    }
    this.orders.getById(value).subscribe({
      next: (order) => {
        this.selected.set({
          id: order.id,
          label: order.purchaseOrderNumber,
          sublabel: order.status,
        });
      },
    });
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(): void {
    return;
  }

  search(query: string): void {
    const q = query.trim();
    this.orders
      .list({ page: '1', pageSize: '20', ...(q ? { search: q } : {}) })
      .subscribe({
        next: ({ data }) => {
          this.suggestions.set(
            data.map((row) => ({
              id: row.id,
              label: row.purchaseOrderNumber,
              sublabel: row.status,
            })),
          );
        },
      });
  }

  onSelect(option: LookupOption | null): void {
    this.selected.set(option);
    this.onChange(option?.id ?? null);
    this.onTouched();
  }
}
