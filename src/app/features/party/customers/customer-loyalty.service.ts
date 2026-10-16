import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';

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

export interface LoyaltyTransactionRow {
  id: string;
  transactionType: string;
  points: number;
  balanceAfterTransaction: number | null;
  transactionDate: string;
  remarks: string | null;
}

@Injectable({ providedIn: 'root' })
export class CustomerLoyaltyService {
  private readonly api = inject(ApiService);

  summary(customerId: string) {
    return this.api.get<CustomerLoyaltySummary>(
      `/customers/${customerId}/loyalty/summary`,
    );
  }

  transactions(customerId: string, page = '1', pageSize = '20') {
    return this.api.getPaginated<LoyaltyTransactionRow>(
      `/customers/${customerId}/loyalty/transactions`,
      { page, pageSize },
    );
  }

  enroll(customerId: string, loyaltyProgramId: string) {
    return this.api.post(`/customers/${customerId}/loyalty-enrollments`, {
      loyaltyProgramId,
    });
  }

  adjust(
    customerId: string,
    body: { loyaltyProgramId: string; pointsDelta: number; remarks?: string },
  ) {
    return this.api.post(`/customers/${customerId}/loyalty/adjustments`, body);
  }
}
