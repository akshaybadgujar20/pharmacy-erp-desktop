import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateSalesInvoiceItemRequest,
  SalesInvoiceItem,
  UpdateSalesInvoiceItemRequest,
} from './sales-invoice-item.models';

@Injectable({ providedIn: 'root' })
export class SalesInvoiceItemService {
  private readonly api = inject(ApiService);

  list(
    invoiceId: string,
    params: Record<string, string>,
  ): Observable<{ data: SalesInvoiceItem[]; pagination: Pagination }> {
    return this.api.getPaginated<SalesInvoiceItem>(
      `/sales-invoices/${invoiceId}/items`,
      params,
    );
  }

  getById(invoiceId: string, id: string): Observable<SalesInvoiceItem> {
    return this.api.get<SalesInvoiceItem>(`/sales-invoices/${invoiceId}/items/${id}`);
  }

  create(
    invoiceId: string,
    body: CreateSalesInvoiceItemRequest,
  ): Observable<SalesInvoiceItem> {
    return this.api.post<SalesInvoiceItem>(`/sales-invoices/${invoiceId}/items`, body);
  }

  update(
    invoiceId: string,
    id: string,
    body: UpdateSalesInvoiceItemRequest,
  ): Observable<SalesInvoiceItem> {
    return this.api.patch<SalesInvoiceItem>(`/sales-invoices/${invoiceId}/items/${id}`, body);
  }

  delete(invoiceId: string, id: string, version: string): Observable<void> {
    return this.api.delete<void>(`/sales-invoices/${invoiceId}/items/${id}`, {
      version: String(version),
    });
  }
}
