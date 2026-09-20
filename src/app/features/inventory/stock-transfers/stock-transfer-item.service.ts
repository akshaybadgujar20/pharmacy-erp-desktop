import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateStockTransferItemRequest,
  StockTransferItem,
  UpdateStockTransferItemRequest,
} from './stock-transfer-item.models';

@Injectable({ providedIn: 'root' })
export class StockTransferItemService {
  private readonly api = inject(ApiService);

  list(
    transferId: string,
    params: Record<string, string>,
  ): Observable<{ data: StockTransferItem[]; pagination: Pagination }> {
    return this.api.getPaginated<StockTransferItem>(
      `/stock-transfers/${transferId}/items`,
      params,
    );
  }

  getById(transferId: string, id: string): Observable<StockTransferItem> {
    return this.api.get<StockTransferItem>(
      `/stock-transfers/${transferId}/items/${id}`,
    );
  }

  create(
    transferId: string,
    body: CreateStockTransferItemRequest,
  ): Observable<StockTransferItem> {
    return this.api.post<StockTransferItem>(
      `/stock-transfers/${transferId}/items`,
      body,
    );
  }

  update(
    transferId: string,
    id: string,
    body: UpdateStockTransferItemRequest,
  ): Observable<StockTransferItem> {
    return this.api.patch<StockTransferItem>(
      `/stock-transfers/${transferId}/items/${id}`,
      body,
    );
  }

  delete(transferId: string, id: string, version: string): Observable<void> {
    return this.api.delete<void>(`/stock-transfers/${transferId}/items/${id}`, {
      version: String(version),
    });
  }
}
