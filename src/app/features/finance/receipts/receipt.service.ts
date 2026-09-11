import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateReceiptRequest,
  FinanceWorkflowRequest,
  Receipt,
  UpdateReceiptRequest,
} from './receipt.models';

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/receipts';

  list(params: Record<string, string>): Observable<{
    data: Receipt[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Receipt>(this.basePath, params);
  }

  getById(id: string): Observable<Receipt> {
    return this.api.get<Receipt>(`${this.basePath}/${id}`);
  }

  create(body: CreateReceiptRequest): Observable<Receipt> {
    return this.api.post<Receipt>(this.basePath, body);
  }

  update(id: string, body: UpdateReceiptRequest): Observable<Receipt> {
    return this.api.patch<Receipt>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }

  complete(id: string, body: FinanceWorkflowRequest): Observable<Receipt> {
    return this.api.post<Receipt>(`${this.basePath}/${id}/complete`, body);
  }

  cancel(id: string, body: FinanceWorkflowRequest): Observable<Receipt> {
    return this.api.post<Receipt>(`${this.basePath}/${id}/cancel`, body);
  }
}
