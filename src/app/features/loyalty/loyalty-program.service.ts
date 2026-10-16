import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Pagination } from '../../core/models/api-response.types';

export interface LoyaltyProgramRow {
  id: string;
  programCode: string;
  programName: string;
  isActive: boolean;
  isDefault: boolean;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyProgramService {
  private readonly api = inject(ApiService);

  list(page = '1', pageSize = '20') {
    return this.api.getPaginated<LoyaltyProgramRow>('/loyalty-programs', {
      page,
      pageSize,
    });
  }
}
