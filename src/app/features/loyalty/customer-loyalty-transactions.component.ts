import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';
import { AppGridComponent } from '../../components/generic/grid';
import { GridPageChange } from '../../components/generic/grid/types/grid-events.types';
import { LOYALTY_TRANSACTION_GRID_CONFIG } from '../party/customers/loyalty-transaction-grid.config';
import {
  CustomerLoyaltyService,
  CustomerLoyaltySummary,
  LoyaltyTransactionRow,
} from '../party/customers/customer-loyalty.service';

@Component({
  selector: 'app-customer-loyalty-transactions',
  standalone: true,
  imports: [AppGridComponent, ButtonModule, RouterLink, TranslatePipe],
  template: `
    <section class="page-layout">
      <header class="page-layout__header">
        <h2>{{ 'loyalty.pointsHistory' | translate }}</h2>
        @if (summary()) {
          <p>
            {{ 'loyalty.balancePoints' | translate }}: {{ summary()!.balancePoints }}
            @if (summary()!.membership) {
              — {{ summary()!.membership!.programName }}
            }
          </p>
        }
        <a
          pButton
          severity="secondary"
          [routerLink]="['/party/customers', customerId()]"
        >
          {{ 'loyalty.backToCustomer' | translate }}
        </a>
      </header>
      <app-grid
        [config]="gridConfig"
        [data]="transactions()"
        [loading]="loading()"
        [totalRecords]="totalRecords()"
        (pageChange)="onPageChange($event)"
      />
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerLoyaltyTransactionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly loyalty = inject(CustomerLoyaltyService);

  readonly gridConfig = LOYALTY_TRANSACTION_GRID_CONFIG;
  readonly customerId = signal('');
  readonly summary = signal<CustomerLoyaltySummary | null>(null);
  readonly transactions = signal<LoyaltyTransactionRow[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('customerId');
    if (!id) {
      void this.router.navigate(['/party/customers']);
      return;
    }
    this.customerId.set(id);
    this.loyalty.summary(id).subscribe({
      next: (data) => this.summary.set(data),
    });
    this.loadTransactions();
  }

  onPageChange(event: GridPageChange): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.loadTransactions();
  }

  private loadTransactions(): void {
    const id = this.customerId();
    if (!id) {
      return;
    }
    this.loading.set(true);
    this.loyalty
      .transactions(id, String(this.page()), String(this.pageSize()))
      .subscribe({
        next: ({ data, pagination }) => {
          this.transactions.set(data);
          this.totalRecords.set(pagination.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}