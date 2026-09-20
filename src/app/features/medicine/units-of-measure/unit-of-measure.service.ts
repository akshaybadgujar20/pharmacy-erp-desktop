import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateUnitOfMeasureRequest,
  UnitOfMeasure,
  UpdateUnitOfMeasureRequest,
} from './unit-of-measure.models';

@Injectable({ providedIn: 'root' })
export class UnitOfMeasureService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/units-of-measure';

  list(params: Record<string, string>): Observable<{
    data: UnitOfMeasure[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<UnitOfMeasure>(this.basePath, params);
  }

  getById(id: string): Observable<UnitOfMeasure> {
    return this.api.get<UnitOfMeasure>(`${this.basePath}/${id}`);
  }

  create(body: CreateUnitOfMeasureRequest): Observable<UnitOfMeasure> {
    return this.api.post<UnitOfMeasure>(this.basePath, body);
  }

  update(id: string, body: UpdateUnitOfMeasureRequest): Observable<UnitOfMeasure> {
    return this.api.patch<UnitOfMeasure>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
