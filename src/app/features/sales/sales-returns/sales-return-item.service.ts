import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateSalesReturnItemRequest,
  SalesReturnItem,
  UpdateSalesReturnItemRequest,
} from './sales-return-item.models';

@Injectable({ providedIn: 'root' })
export class SalesReturnItemService {
  private readonly api = inject(ApiService);

  list(
    returnId: string,
    params: Record<string, string>,
  ): Observable<{ data: SalesReturnItem[]; pagination: Pagination }> {
    return this.api.getPaginated<SalesReturnItem>(
      `/sales-returns/${returnId}/items`,
      params,
    );
  }

  getById(returnId: string, id: string): Observable<SalesReturnItem> {
    return this.api.get<SalesReturnItem>(`/sales-returns/${returnId}/items/${id}`);
  }

  create(returnId: string, body: CreateSalesReturnItemRequest): Observable<SalesReturnItem> {
    return this.api.post<SalesReturnItem>(`/sales-returns/${returnId}/items`, body);
  }

  update(
    returnId: string,
    id: string,
    body: UpdateSalesReturnItemRequest,
  ): Observable<SalesReturnItem> {
    return this.api.patch<SalesReturnItem>(`/sales-returns/${returnId}/items/${id}`, body);
  }

  delete(returnId: string, id: string, version: string): Observable<void> {
    return this.api.delete<void>(`/sales-returns/${returnId}/items/${id}`, {
      version: String(version),
    });
  }
}
