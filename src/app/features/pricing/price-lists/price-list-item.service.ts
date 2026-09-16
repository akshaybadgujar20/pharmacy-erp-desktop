import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePriceListItemRequest,
  PriceListItem,
  UpdatePriceListItemRequest,
} from './price-list-item.models';

@Injectable({ providedIn: 'root' })
export class PriceListItemService {
  private readonly api = inject(ApiService);

  list(
    priceListId: string,
    params: Record<string, string>,
  ): Observable<{ data: PriceListItem[]; pagination: Pagination }> {
    return this.api.getPaginated<PriceListItem>(
      `/price-lists/${priceListId}/items`,
      params,
    );
  }

  getById(priceListId: string, id: string): Observable<PriceListItem> {
    return this.api.get<PriceListItem>(
      `/price-lists/${priceListId}/items/${id}`,
    );
  }

  create(
    priceListId: string,
    body: CreatePriceListItemRequest,
  ): Observable<PriceListItem> {
    return this.api.post<PriceListItem>(
      `/price-lists/${priceListId}/items`,
      body,
    );
  }

  update(
    priceListId: string,
    id: string,
    body: UpdatePriceListItemRequest,
  ): Observable<PriceListItem> {
    return this.api.patch<PriceListItem>(
      `/price-lists/${priceListId}/items/${id}`,
      body,
    );
  }

  delete(priceListId: string, id: string, version: number): Observable<void> {
    return this.api.delete<void>(`/price-lists/${priceListId}/items/${id}`, {
      version: String(version),
    });
  }
}
