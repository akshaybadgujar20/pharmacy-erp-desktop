import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePartyContactRequest,
  PartyContact,
  UpdatePartyContactRequest,
} from './party-contact.models';

@Injectable({ providedIn: 'root' })
export class PartyContactService {
  private readonly api = inject(ApiService);

  list(
    partyId: string,
    params: Record<string, string>,
  ): Observable<{ data: PartyContact[]; pagination: Pagination }> {
    return this.api.getPaginated<PartyContact>(
      `/parties/${partyId}/contacts`,
      params,
    );
  }

  getById(partyId: string, id: string): Observable<PartyContact> {
    return this.api.get<PartyContact>(`/parties/${partyId}/contacts/${id}`);
  }

  create(
    partyId: string,
    body: CreatePartyContactRequest,
  ): Observable<PartyContact> {
    return this.api.post<PartyContact>(`/parties/${partyId}/contacts`, body);
  }

  update(
    partyId: string,
    id: string,
    body: UpdatePartyContactRequest,
  ): Observable<PartyContact> {
    return this.api.patch<PartyContact>(
      `/parties/${partyId}/contacts/${id}`,
      body,
    );
  }

  delete(partyId: string, id: string, version: number): Observable<void> {
    return this.api.delete<void>(`/parties/${partyId}/contacts/${id}`, {
      version: String(version),
    });
  }
}
