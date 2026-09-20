import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePurchaseInvoiceItemRequest,
  PurchaseInvoiceItem,
  UpdatePurchaseInvoiceItemRequest,
} from './purchase-invoice-item.models';

@Injectable({ providedIn: 'root' })
export class PurchaseInvoiceItemService {
  private readonly api = inject(ApiService);

  list(
    invoiceId: string,
    params: Record<string, string>,
  ): Observable<{ data: PurchaseInvoiceItem[]; pagination: Pagination }> {
    return this.api.getPaginated<PurchaseInvoiceItem>(
      `/purchase-invoices/${invoiceId}/items`,
      params,
    );
  }

  create(
    invoiceId: string,
    body: CreatePurchaseInvoiceItemRequest,
  ): Observable<PurchaseInvoiceItem> {
    return this.api.post<PurchaseInvoiceItem>(
      `/purchase-invoices/${invoiceId}/items`,
      body,
    );
  }

  update(
    invoiceId: string,
    id: string,
    body: UpdatePurchaseInvoiceItemRequest,
  ): Observable<PurchaseInvoiceItem> {
    return this.api.patch<PurchaseInvoiceItem>(
      `/purchase-invoices/${invoiceId}/items/${id}`,
      body,
    );
  }

  delete(invoiceId: string, id: string, version: string): Observable<void> {
    return this.api.delete<void>(`/purchase-invoices/${invoiceId}/items/${id}`, {
      version: String(version),
    });
  }
}
