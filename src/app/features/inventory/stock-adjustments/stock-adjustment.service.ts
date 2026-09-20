import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  ApproveStockAdjustmentRequest,
  CreateStockAdjustmentRequest,
  StockAdjustment,
  UpdateStockAdjustmentRequest,
} from './stock-adjustment.models';

@Injectable({ providedIn: 'root' })
export class StockAdjustmentService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/stock-adjustments';

  list(params: Record<string, string>): Observable<{
    data: StockAdjustment[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<StockAdjustment>(this.basePath, params);
  }

  getById(id: string): Observable<StockAdjustment> {
    return this.api.get<StockAdjustment>(`${this.basePath}/${id}`);
  }

  create(body: CreateStockAdjustmentRequest): Observable<StockAdjustment> {
    return this.api.post<StockAdjustment>(this.basePath, body);
  }

  update(id: string, body: UpdateStockAdjustmentRequest): Observable<StockAdjustment> {
    return this.api.patch<StockAdjustment>(`${this.basePath}/${id}`, body);
  }

  approve(id: string, body?: ApproveStockAdjustmentRequest): Observable<StockAdjustment> {
    return this.api.post<StockAdjustment>(`${this.basePath}/${id}/approve`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
