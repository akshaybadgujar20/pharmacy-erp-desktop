import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateCustomerRequest,
  Customer,
  UpdateCustomerRequest,
} from './customer.models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/customers';

  list(params: Record<string, string>): Observable<{
    data: Customer[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Customer>(this.basePath, params);
  }

  getById(id: string): Observable<Customer> {
    return this.api.get<Customer>(`${this.basePath}/${id}`);
  }

  create(body: CreateCustomerRequest): Observable<Customer> {
    return this.api.post<Customer>(this.basePath, body);
  }

  update(id: string, body: UpdateCustomerRequest): Observable<Customer> {
    return this.api.patch<Customer>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
