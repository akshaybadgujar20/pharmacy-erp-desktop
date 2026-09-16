import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePrescriptionItemRequest,
  PrescriptionItem,
  UpdatePrescriptionItemRequest,
} from './prescription-item.models';

@Injectable({ providedIn: 'root' })
export class PrescriptionItemService {
  private readonly api = inject(ApiService);

  list(
    prescriptionId: string,
    params: Record<string, string>,
  ): Observable<{ data: PrescriptionItem[]; pagination: Pagination }> {
    return this.api.getPaginated<PrescriptionItem>(
      `/prescriptions/${prescriptionId}/items`,
      params,
    );
  }

  getById(prescriptionId: string, id: string): Observable<PrescriptionItem> {
    return this.api.get<PrescriptionItem>(
      `/prescriptions/${prescriptionId}/items/${id}`,
    );
  }

  create(
    prescriptionId: string,
    body: CreatePrescriptionItemRequest,
  ): Observable<PrescriptionItem> {
    return this.api.post<PrescriptionItem>(
      `/prescriptions/${prescriptionId}/items`,
      body,
    );
  }

  update(
    prescriptionId: string,
    id: string,
    body: UpdatePrescriptionItemRequest,
  ): Observable<PrescriptionItem> {
    return this.api.patch<PrescriptionItem>(
      `/prescriptions/${prescriptionId}/items/${id}`,
      body,
    );
  }

  delete(
    prescriptionId: string,
    id: string,
    version: number,
  ): Observable<void> {
    return this.api.delete<void>(
      `/prescriptions/${prescriptionId}/items/${id}`,
      { version: String(version) },
    );
  }
}
