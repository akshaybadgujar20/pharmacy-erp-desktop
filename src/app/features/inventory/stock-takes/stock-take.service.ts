import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateStockTakeRequest,
  ReconcileStockTakeRequest,
  StockTake,
  UpdateStockTakeRequest,
} from './stock-take.models';

@Injectable({ providedIn: 'root' })
export class StockTakeService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/stock-takes';

  list(params: Record<string, string>): Observable<{
    data: StockTake[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<StockTake>(this.basePath, params);
  }

  getById(id: string): Observable<StockTake> {
    return this.api.get<StockTake>(`${this.basePath}/${id}`);
  }

  create(body: CreateStockTakeRequest): Observable<StockTake> {
    return this.api.post<StockTake>(this.basePath, body);
  }

  update(id: string, body: UpdateStockTakeRequest): Observable<StockTake> {
    return this.api.patch<StockTake>(`${this.basePath}/${id}`, body);
  }

  start(id: string): Observable<StockTake> {
    return this.api.post<StockTake>(`${this.basePath}/${id}/start`);
  }

  complete(id: string): Observable<StockTake> {
    return this.api.post<StockTake>(`${this.basePath}/${id}/complete`);
  }

  reconcile(id: string, body?: ReconcileStockTakeRequest): Observable<StockTake> {
    return this.api.post<StockTake>(`${this.basePath}/${id}/reconcile`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
