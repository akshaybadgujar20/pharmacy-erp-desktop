import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import { CreatePartyRequest, Party, UpdatePartyRequest } from './party.models';

@Injectable({ providedIn: 'root' })
export class PartyService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/parties';

  list(params: Record<string, string>): Observable<{
    data: Party[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Party>(this.basePath, params);
  }

  getById(id: string): Observable<Party> {
    return this.api.get<Party>(`${this.basePath}/${id}`);
  }

  create(body: CreatePartyRequest): Observable<Party> {
    return this.api.post<Party>(this.basePath, body);
  }

  update(id: string, body: UpdatePartyRequest): Observable<Party> {
    return this.api.patch<Party>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
