import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePriceListRequest,
  PriceList,
  UpdatePriceListRequest,
} from './price-list.models';

@Injectable({ providedIn: 'root' })
export class PriceListService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/price-lists';

  list(params: Record<string, string>): Observable<{
    data: PriceList[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<PriceList>(this.basePath, params);
  }

  getById(id: string): Observable<PriceList> {
    return this.api.get<PriceList>(`${this.basePath}/${id}`);
  }

  create(body: CreatePriceListRequest): Observable<PriceList> {
    return this.api.post<PriceList>(this.basePath, body);
  }

  update(id: string, body: UpdatePriceListRequest): Observable<PriceList> {
    return this.api.patch<PriceList>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
