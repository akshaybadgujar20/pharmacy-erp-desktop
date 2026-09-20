import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateFinancialYearRequest,
  FinancialYear,
  UpdateFinancialYearRequest,
} from './financial-year.models';

@Injectable({ providedIn: 'root' })
export class FinancialYearService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/financial-years';

  list(params: Record<string, string>): Observable<{
    data: FinancialYear[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<FinancialYear>(this.basePath, params);
  }

  getById(id: string): Observable<FinancialYear> {
    return this.api.get<FinancialYear>(`${this.basePath}/${id}`);
  }

  create(body: CreateFinancialYearRequest): Observable<FinancialYear> {
    return this.api.post<FinancialYear>(this.basePath, body);
  }

  update(id: string, body: UpdateFinancialYearRequest): Observable<FinancialYear> {
    return this.api.patch<FinancialYear>(`${this.basePath}/${id}`, body);
  }

  close(id: string, version: string): Observable<FinancialYear> {
    return this.api.post<FinancialYear>(
      `${this.basePath}/${id}/close?version=${version}`,
    );
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
