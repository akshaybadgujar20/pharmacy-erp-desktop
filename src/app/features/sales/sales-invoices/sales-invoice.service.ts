import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateSalesInvoiceRequest,
  SalesInvoice,
  SalesWorkflowRequest,
  UpdateSalesInvoiceRequest,
} from './sales-invoice.models';

@Injectable({ providedIn: 'root' })
export class SalesInvoiceService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/sales-invoices';

  list(params: Record<string, string>): Observable<{
    data: SalesInvoice[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<SalesInvoice>(this.basePath, params);
  }

  getById(id: string): Observable<SalesInvoice> {
    return this.api.get<SalesInvoice>(`${this.basePath}/${id}`);
  }

  create(body: CreateSalesInvoiceRequest): Observable<SalesInvoice> {
    return this.api.post<SalesInvoice>(this.basePath, body);
  }

  update(id: string, body: UpdateSalesInvoiceRequest): Observable<SalesInvoice> {
    return this.api.patch<SalesInvoice>(`${this.basePath}/${id}`, body);
  }

  post(id: string, body: SalesWorkflowRequest): Observable<SalesInvoice> {
    return this.api.post<SalesInvoice>(`${this.basePath}/${id}/post`, body);
  }

  cancel(id: string, body: SalesWorkflowRequest): Observable<SalesInvoice> {
    return this.api.post<SalesInvoice>(`${this.basePath}/${id}/cancel`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
