import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateDiscountRuleRequest,
  DiscountRule,
  UpdateDiscountRuleRequest,
} from './discount-rule.models';

@Injectable({ providedIn: 'root' })
export class DiscountRuleService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/discount-rules';

  list(params: Record<string, string>): Observable<{
    data: DiscountRule[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<DiscountRule>(this.basePath, params);
  }

  getById(id: string): Observable<DiscountRule> {
    return this.api.get<DiscountRule>(`${this.basePath}/${id}`);
  }

  create(body: CreateDiscountRuleRequest): Observable<DiscountRule> {
    return this.api.post<DiscountRule>(this.basePath, body);
  }

  update(id: string, body: UpdateDiscountRuleRequest): Observable<DiscountRule> {
    return this.api.patch<DiscountRule>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
