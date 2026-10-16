import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import {
  CreateLoyaltyProgramRequest,
  LoyaltyProgram,
  UpdateLoyaltyProgramRequest,
} from './loyalty-program.models';

export type LoyaltyProgramRow = Pick<
  LoyaltyProgram,
  'id' | 'programCode' | 'programName' | 'isActive' | 'isDefault'
>;

@Injectable({ providedIn: 'root' })
export class LoyaltyProgramService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/loyalty-programs';

  list(page = '1', pageSize = '20') {
    return this.api.getPaginated<LoyaltyProgramRow>(this.basePath, {
      page,
      pageSize,
    });
  }

  getById(id: string) {
    return this.api.get<LoyaltyProgram>(`${this.basePath}/${id}`);
  }

  create(body: CreateLoyaltyProgramRequest) {
    return this.api.post<LoyaltyProgram>(this.basePath, body);
  }

  update(id: string, body: UpdateLoyaltyProgramRequest) {
    return this.api.patch<LoyaltyProgram>(`${this.basePath}/${id}`, body);
  }
}
