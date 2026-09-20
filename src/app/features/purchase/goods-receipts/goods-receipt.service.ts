import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateGoodsReceiptRequest,
  GoodsReceipt,
  GoodsReceiptWorkflowRequest,
  UpdateGoodsReceiptRequest,
} from './goods-receipt.models';

@Injectable({ providedIn: 'root' })
export class GoodsReceiptService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/goods-receipts';

  list(params: Record<string, string>): Observable<{
    data: GoodsReceipt[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<GoodsReceipt>(this.basePath, params);
  }

  getById(id: string): Observable<GoodsReceipt> {
    return this.api.get<GoodsReceipt>(`${this.basePath}/${id}`);
  }

  create(body: CreateGoodsReceiptRequest): Observable<GoodsReceipt> {
    return this.api.post<GoodsReceipt>(this.basePath, body);
  }

  update(id: string, body: UpdateGoodsReceiptRequest): Observable<GoodsReceipt> {
    return this.api.patch<GoodsReceipt>(`${this.basePath}/${id}`, body);
  }

  submitInspection(
    id: string,
    body: GoodsReceiptWorkflowRequest,
  ): Observable<GoodsReceipt> {
    return this.api.post<GoodsReceipt>(`${this.basePath}/${id}/submit-inspection`, body);
  }

  accept(id: string, body: GoodsReceiptWorkflowRequest): Observable<GoodsReceipt> {
    return this.api.post<GoodsReceipt>(`${this.basePath}/${id}/accept`, body);
  }

  reject(id: string, body: GoodsReceiptWorkflowRequest): Observable<GoodsReceipt> {
    return this.api.post<GoodsReceipt>(`${this.basePath}/${id}/reject`, body);
  }

  cancel(id: string, body: GoodsReceiptWorkflowRequest): Observable<GoodsReceipt> {
    return this.api.post<GoodsReceipt>(`${this.basePath}/${id}/cancel`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
