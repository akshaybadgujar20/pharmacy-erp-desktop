import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePurchaseInvoiceRequest,
  PurchaseInvoice,
  PurchaseInvoiceWorkflowRequest,
  UpdatePurchaseInvoiceRequest,
} from './purchase-invoice.models';

@Injectable({ providedIn: 'root' })
export class PurchaseInvoiceService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/purchase-invoices';

  list(params: Record<string, string>): Observable<{
    data: PurchaseInvoice[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<PurchaseInvoice>(this.basePath, params);
  }

  getById(id: string): Observable<PurchaseInvoice> {
    return this.api.get<PurchaseInvoice>(`${this.basePath}/${id}`);
  }

  create(body: CreatePurchaseInvoiceRequest): Observable<PurchaseInvoice> {
    return this.api.post<PurchaseInvoice>(this.basePath, body);
  }

  update(id: string, body: UpdatePurchaseInvoiceRequest): Observable<PurchaseInvoice> {
    return this.api.patch<PurchaseInvoice>(`${this.basePath}/${id}`, body);
  }

  post(id: string, body: PurchaseInvoiceWorkflowRequest): Observable<PurchaseInvoice> {
    return this.api.post<PurchaseInvoice>(`${this.basePath}/${id}/post`, body);
  }

  cancel(id: string, body: PurchaseInvoiceWorkflowRequest): Observable<PurchaseInvoice> {
    return this.api.post<PurchaseInvoice>(`${this.basePath}/${id}/cancel`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
