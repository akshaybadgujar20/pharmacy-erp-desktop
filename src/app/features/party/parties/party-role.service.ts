import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePartyRoleRequest,
  PartyRole,
  UpdatePartyRoleRequest,
} from './party-role.models';

@Injectable({ providedIn: 'root' })
export class PartyRoleService {
  private readonly api = inject(ApiService);

  list(
    partyId: string,
    params: Record<string, string>,
  ): Observable<{ data: PartyRole[]; pagination: Pagination }> {
    return this.api.getPaginated<PartyRole>(`/parties/${partyId}/roles`, params);
  }

  getById(partyId: string, id: string): Observable<PartyRole> {
    return this.api.get<PartyRole>(`/parties/${partyId}/roles/${id}`);
  }

  create(partyId: string, body: CreatePartyRoleRequest): Observable<PartyRole> {
    return this.api.post<PartyRole>(`/parties/${partyId}/roles`, body);
  }

  update(
    partyId: string,
    id: string,
    body: UpdatePartyRoleRequest,
  ): Observable<PartyRole> {
    return this.api.patch<PartyRole>(`/parties/${partyId}/roles/${id}`, body);
  }

  delete(partyId: string, id: string, version: string): Observable<void> {
    return this.api.delete<void>(`/parties/${partyId}/roles/${id}`, {
      version: String(version),
    });
  }
}
