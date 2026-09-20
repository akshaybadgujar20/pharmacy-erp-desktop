import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateSupplierRequest,
  Supplier,
  UpdateSupplierRequest,
} from './supplier.models';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/suppliers';

  list(params: Record<string, string>): Observable<{
    data: Supplier[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Supplier>(this.basePath, params);
  }

  getById(id: string): Observable<Supplier> {
    return this.api.get<Supplier>(`${this.basePath}/${id}`);
  }

  create(body: CreateSupplierRequest): Observable<Supplier> {
    return this.api.post<Supplier>(this.basePath, body);
  }

  update(id: string, body: UpdateSupplierRequest): Observable<Supplier> {
    return this.api.patch<Supplier>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
