import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateSequenceGeneratorRequest,
  SequenceGenerator,
  UpdateSequenceGeneratorRequest,
} from './sequence-generator.models';

@Injectable({ providedIn: 'root' })
export class SequenceGeneratorService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/sequence-generators';

  list(params: Record<string, string>): Observable<{
    data: SequenceGenerator[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<SequenceGenerator>(this.basePath, params);
  }

  getById(id: string): Observable<SequenceGenerator> {
    return this.api.get<SequenceGenerator>(`${this.basePath}/${id}`);
  }

  create(body: CreateSequenceGeneratorRequest): Observable<SequenceGenerator> {
    return this.api.post<SequenceGenerator>(this.basePath, body);
  }

  update(id: string, body: UpdateSequenceGeneratorRequest): Observable<SequenceGenerator> {
    return this.api.patch<SequenceGenerator>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
