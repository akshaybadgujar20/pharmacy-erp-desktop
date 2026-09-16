import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateSalesInvoicePaymentRequest,
  SalesInvoicePayment,
  SalesPaymentWorkflowRequest,
  UpdateSalesInvoicePaymentRequest,
} from './sales-invoice-payment.models';

@Injectable({ providedIn: 'root' })
export class SalesInvoicePaymentService {
  private readonly api = inject(ApiService);

  list(
    invoiceId: string,
    params: Record<string, string>,
  ): Observable<{ data: SalesInvoicePayment[]; pagination: Pagination }> {
    return this.api.getPaginated<SalesInvoicePayment>(
      `/sales-invoices/${invoiceId}/payments`,
      params,
    );
  }

  getById(invoiceId: string, id: string): Observable<SalesInvoicePayment> {
    return this.api.get<SalesInvoicePayment>(`/sales-invoices/${invoiceId}/payments/${id}`);
  }

  create(
    invoiceId: string,
    body: CreateSalesInvoicePaymentRequest,
  ): Observable<SalesInvoicePayment> {
    return this.api.post<SalesInvoicePayment>(`/sales-invoices/${invoiceId}/payments`, body);
  }

  update(
    invoiceId: string,
    id: string,
    body: UpdateSalesInvoicePaymentRequest,
  ): Observable<SalesInvoicePayment> {
    return this.api.patch<SalesInvoicePayment>(
      `/sales-invoices/${invoiceId}/payments/${id}`,
      body,
    );
  }

  complete(
    invoiceId: string,
    id: string,
    body: SalesPaymentWorkflowRequest,
  ): Observable<SalesInvoicePayment> {
    return this.api.post<SalesInvoicePayment>(
      `/sales-invoices/${invoiceId}/payments/${id}/complete`,
      body,
    );
  }

  cancel(
    invoiceId: string,
    id: string,
    body: SalesPaymentWorkflowRequest,
  ): Observable<SalesInvoicePayment> {
    return this.api.post<SalesInvoicePayment>(
      `/sales-invoices/${invoiceId}/payments/${id}/cancel`,
      body,
    );
  }

  delete(invoiceId: string, id: string, version: number): Observable<void> {
    return this.api.delete<void>(`/sales-invoices/${invoiceId}/payments/${id}`, {
      version: String(version),
    });
  }
}
