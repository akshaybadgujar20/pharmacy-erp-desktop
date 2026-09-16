import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateGoodsReceiptItemRequest,
  GoodsReceiptItem,
  UpdateGoodsReceiptItemRequest,
} from './goods-receipt-item.models';

@Injectable({ providedIn: 'root' })
export class GoodsReceiptItemService {
  private readonly api = inject(ApiService);

  list(
    goodsReceiptId: string,
    params: Record<string, string>,
  ): Observable<{ data: GoodsReceiptItem[]; pagination: Pagination }> {
    return this.api.getPaginated<GoodsReceiptItem>(
      `/goods-receipts/${goodsReceiptId}/items`,
      params,
    );
  }

  create(
    goodsReceiptId: string,
    body: CreateGoodsReceiptItemRequest,
  ): Observable<GoodsReceiptItem> {
    return this.api.post<GoodsReceiptItem>(`/goods-receipts/${goodsReceiptId}/items`, body);
  }

  update(
    goodsReceiptId: string,
    id: string,
    body: UpdateGoodsReceiptItemRequest,
  ): Observable<GoodsReceiptItem> {
    return this.api.patch<GoodsReceiptItem>(
      `/goods-receipts/${goodsReceiptId}/items/${id}`,
      body,
    );
  }

  delete(goodsReceiptId: string, id: string, version: number): Observable<void> {
    return this.api.delete<void>(`/goods-receipts/${goodsReceiptId}/items/${id}`, {
      version: String(version),
    });
  }
}
