import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateStockTakeItemRequest,
  StockTakeItem,
  UpdateStockTakeItemRequest,
} from './stock-take-item.models';

@Injectable({ providedIn: 'root' })
export class StockTakeItemService {
  private readonly api = inject(ApiService);

  list(
    stockTakeId: string,
    params: Record<string, string>,
  ): Observable<{ data: StockTakeItem[]; pagination: Pagination }> {
    return this.api.getPaginated<StockTakeItem>(
      `/stock-takes/${stockTakeId}/items`,
      params,
    );
  }

  getById(stockTakeId: string, id: string): Observable<StockTakeItem> {
    return this.api.get<StockTakeItem>(
      `/stock-takes/${stockTakeId}/items/${id}`,
    );
  }

  create(
    stockTakeId: string,
    body: CreateStockTakeItemRequest,
  ): Observable<StockTakeItem> {
    return this.api.post<StockTakeItem>(
      `/stock-takes/${stockTakeId}/items`,
      body,
    );
  }

  update(
    stockTakeId: string,
    id: string,
    body: UpdateStockTakeItemRequest,
  ): Observable<StockTakeItem> {
    return this.api.patch<StockTakeItem>(
      `/stock-takes/${stockTakeId}/items/${id}`,
      body,
    );
  }

  delete(stockTakeId: string, id: string, version: string): Observable<void> {
    return this.api.delete<void>(`/stock-takes/${stockTakeId}/items/${id}`, {
      version: String(version),
    });
  }
}
