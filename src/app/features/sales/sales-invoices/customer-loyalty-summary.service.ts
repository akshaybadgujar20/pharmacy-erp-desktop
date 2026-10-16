import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface CustomerLoyaltySummary {
  customerId: string;
  balancePoints: number;
  membership: {
    id: string;
    loyaltyProgramId: string;
    programCode: string;
    programName: string;
    status: string;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class CustomerLoyaltySummaryService {
  private readonly api = inject(ApiService);

  getSummary(customerId: string) {
    return this.api.get<CustomerLoyaltySummary>(
      `/customers/${customerId}/loyalty/summary`,
    );
  }
}
