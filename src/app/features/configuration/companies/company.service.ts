import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from './company.models';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/companies';

  list(params: Record<string, string>): Observable<{
    data: Company[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Company>(this.basePath, params);
  }

  getById(id: string): Observable<Company> {
    return this.api.get<Company>(`${this.basePath}/${id}`);
  }

  create(body: CreateCompanyRequest): Observable<Company> {
    return this.api.post<Company>(this.basePath, body);
  }

  update(id: string, body: UpdateCompanyRequest): Observable<Company> {
    return this.api.patch<Company>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
