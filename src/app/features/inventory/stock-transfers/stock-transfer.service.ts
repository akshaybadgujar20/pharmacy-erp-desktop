import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateStockTransferRequest,
  DispatchStockTransferRequest,
  ReceiveStockTransferRequest,
  StockTransfer,
  UpdateStockTransferRequest,
} from './stock-transfer.models';

@Injectable({ providedIn: 'root' })
export class StockTransferService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/stock-transfers';

  list(params: Record<string, string>): Observable<{
    data: StockTransfer[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<StockTransfer>(this.basePath, params);
  }

  getById(id: string): Observable<StockTransfer> {
    return this.api.get<StockTransfer>(`${this.basePath}/${id}`);
  }

  create(body: CreateStockTransferRequest): Observable<StockTransfer> {
    return this.api.post<StockTransfer>(this.basePath, body);
  }

  update(id: string, body: UpdateStockTransferRequest): Observable<StockTransfer> {
    return this.api.patch<StockTransfer>(`${this.basePath}/${id}`, body);
  }

  dispatch(id: string, body?: DispatchStockTransferRequest): Observable<StockTransfer> {
    return this.api.post<StockTransfer>(`${this.basePath}/${id}/dispatch`, body);
  }

  receive(id: string, body?: ReceiveStockTransferRequest): Observable<StockTransfer> {
    return this.api.post<StockTransfer>(`${this.basePath}/${id}/receive`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
