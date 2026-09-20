import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePaymentRequest,
  FinanceWorkflowRequest,
  Payment,
  UpdatePaymentRequest,
} from './payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/payments';

  list(params: Record<string, string>): Observable<{
    data: Payment[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Payment>(this.basePath, params);
  }

  getById(id: string): Observable<Payment> {
    return this.api.get<Payment>(`${this.basePath}/${id}`);
  }

  create(body: CreatePaymentRequest): Observable<Payment> {
    return this.api.post<Payment>(this.basePath, body);
  }

  update(id: string, body: UpdatePaymentRequest): Observable<Payment> {
    return this.api.patch<Payment>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }

  complete(id: string, body: FinanceWorkflowRequest): Observable<Payment> {
    return this.api.post<Payment>(`${this.basePath}/${id}/complete`, body);
  }

  cancel(id: string, body: FinanceWorkflowRequest): Observable<Payment> {
    return this.api.post<Payment>(`${this.basePath}/${id}/cancel`, body);
  }
}
