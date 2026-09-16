import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  Country,
  CreateCountryRequest,
  UpdateCountryRequest,
} from './country.models';

@Injectable({ providedIn: 'root' })
export class CountryService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/countries';

  list(params: Record<string, string>): Observable<{
    data: Country[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Country>(this.basePath, params);
  }

  getById(id: string): Observable<Country> {
    return this.api.get<Country>(`${this.basePath}/${id}`);
  }

  create(body: CreateCountryRequest): Observable<Country> {
    return this.api.post<Country>(this.basePath, body);
  }

  update(id: string, body: UpdateCountryRequest): Observable<Country> {
    return this.api.patch<Country>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
