import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateManufacturerRequest,
  Manufacturer,
  UpdateManufacturerRequest,
} from './manufacturer.models';

@Injectable({ providedIn: 'root' })
export class ManufacturerService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/manufacturers';

  list(params: Record<string, string>): Observable<{
    data: Manufacturer[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Manufacturer>(this.basePath, params);
  }

  getById(id: string): Observable<Manufacturer> {
    return this.api.get<Manufacturer>(`${this.basePath}/${id}`);
  }

  create(body: CreateManufacturerRequest): Observable<Manufacturer> {
    return this.api.post<Manufacturer>(this.basePath, body);
  }

  update(id: string, body: UpdateManufacturerRequest): Observable<Manufacturer> {
    return this.api.patch<Manufacturer>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
