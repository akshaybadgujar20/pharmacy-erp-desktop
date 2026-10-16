import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CustomerLoyaltyTabComponent } from './customer-loyalty-tab.component';

@Component({
  selector: 'app-customer-loyalty-route',
  standalone: true,
  imports: [CustomerLoyaltyTabComponent],
  template: `
    @if (customerId()) {
      <app-customer-loyalty-tab [customerId]="customerId()!" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerLoyaltyRouteComponent {
  private readonly route = inject(ActivatedRoute);
  readonly customerId = () => this.route.snapshot.paramMap.get('customerId');
}
