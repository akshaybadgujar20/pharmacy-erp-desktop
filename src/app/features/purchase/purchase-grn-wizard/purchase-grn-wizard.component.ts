import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PurchaseOrderService } from '../purchase-orders/purchase-order.service';

@Component({
  selector: 'app-purchase-grn-wizard',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <h2>PO to GRN wizard</h2>
    <p>Select a posted purchase order, then create a goods receipt from it.</p>
    <p>After GRN is saved, open the GRN detail to post it, then create a purchase invoice linked to that GRN.</p>
    <ul>
      @for (row of orders(); track row.id) {
        <li>
          {{ row.purchaseOrderNumber }} — {{ row.status }}
          <button pButton type="button" label="Create GRN" (click)="createGrn(row.id)"></button>
        </li>
      }
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseGrnWizardComponent {
  private readonly purchaseOrders = inject(PurchaseOrderService);
  private readonly router = inject(Router);
  readonly orders = signal<{ id: string; purchaseOrderNumber: string; status: string }[]>([]);

  constructor() {
    this.purchaseOrders.list({ page: '1', pageSize: '25' }).subscribe({
      next: ({ data }) => this.orders.set(data),
    });
  }

  createGrn(purchaseOrderId: string): void {
    this.router.navigate(['/purchase/goods-receipts/new'], {
      queryParams: { purchaseOrderId },
    });
  }
}
