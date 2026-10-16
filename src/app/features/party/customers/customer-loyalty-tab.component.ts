import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import {
  CustomerLoyaltyService,
  CustomerLoyaltySummary,
  LoyaltyTransactionRow,
} from './customer-loyalty.service';

@Component({
  selector: 'app-customer-loyalty-tab',
  standalone: true,
  imports: [ButtonModule, InputTextModule],
  template: `
    @if (summary()) {
      <p>Balance: {{ summary()!.balancePoints }} points</p>
      @if (summary()!.membership) {
        <p>Program: {{ summary()!.membership!.programName }}</p>
      }
    }
    <div class="detail-form__field">
      <label for="programId">Program ID to enroll</label>
      <input pInputText id="programId" [value]="programId()" (input)="onProgramId($event)" />
      <button pButton type="button" label="Enroll" (click)="enroll()"></button>
    </div>
    <ul>
      @for (row of transactions(); track row.id) {
        <li>{{ row.transactionType }}: {{ row.points }} ({{ row.transactionDate }})</li>
      }
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerLoyaltyTabComponent implements OnInit {
  private readonly loyalty = inject(CustomerLoyaltyService);

  readonly customerId = input.required<string>();

  readonly summary = signal<CustomerLoyaltySummary | null>(null);
  readonly transactions = signal<LoyaltyTransactionRow[]>([]);
  readonly programId = signal('');

  ngOnInit(): void {
    this.reload();
  }

  onProgramId(event: Event): void {
    this.programId.set((event.target as HTMLInputElement).value);
  }

  enroll(): void {
    const programId = this.programId().trim();
    if (!programId) {
      return;
    }
    this.loyalty.enroll(this.customerId(), programId).subscribe({
      next: () => this.reload(),
    });
  }

  private reload(): void {
    this.loyalty.summary(this.customerId()).subscribe({
      next: (data) => this.summary.set(data),
    });
    this.loyalty.transactions(this.customerId()).subscribe({
      next: ({ data }) => this.transactions.set(data),
    });
  }
}
