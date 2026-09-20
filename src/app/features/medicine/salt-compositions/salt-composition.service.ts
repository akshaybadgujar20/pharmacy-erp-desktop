import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateSaltCompositionRequest,
  SaltComposition,
  UpdateSaltCompositionRequest,
} from './salt-composition.models';

@Injectable({ providedIn: 'root' })
export class SaltCompositionService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/salt-compositions';

  list(params: Record<string, string>): Observable<{
    data: SaltComposition[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<SaltComposition>(this.basePath, params);
  }

  getById(id: string): Observable<SaltComposition> {
    return this.api.get<SaltComposition>(`${this.basePath}/${id}`);
  }

  create(body: CreateSaltCompositionRequest): Observable<SaltComposition> {
    return this.api.post<SaltComposition>(this.basePath, body);
  }

  update(id: string, body: UpdateSaltCompositionRequest): Observable<SaltComposition> {
    return this.api.patch<SaltComposition>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
