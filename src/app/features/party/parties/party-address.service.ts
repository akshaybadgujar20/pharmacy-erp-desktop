import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePartyAddressRequest,
  PartyAddress,
  UpdatePartyAddressRequest,
} from './party-address.models';

@Injectable({ providedIn: 'root' })
export class PartyAddressService {
  private readonly api = inject(ApiService);

  list(
    partyId: string,
    params: Record<string, string>,
  ): Observable<{ data: PartyAddress[]; pagination: Pagination }> {
    return this.api.getPaginated<PartyAddress>(
      `/parties/${partyId}/addresses`,
      params,
    );
  }

  getById(partyId: string, id: string): Observable<PartyAddress> {
    return this.api.get<PartyAddress>(`/parties/${partyId}/addresses/${id}`);
  }

  create(
    partyId: string,
    body: CreatePartyAddressRequest,
  ): Observable<PartyAddress> {
    return this.api.post<PartyAddress>(`/parties/${partyId}/addresses`, body);
  }

  update(
    partyId: string,
    id: string,
    body: UpdatePartyAddressRequest,
  ): Observable<PartyAddress> {
    return this.api.patch<PartyAddress>(
      `/parties/${partyId}/addresses/${id}`,
      body,
    );
  }

  delete(partyId: string, id: string, version: string): Observable<void> {
    return this.api.delete<void>(`/parties/${partyId}/addresses/${id}`, {
      version: String(version),
    });
  }
}
