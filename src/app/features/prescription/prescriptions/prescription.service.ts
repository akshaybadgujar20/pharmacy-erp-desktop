import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePrescriptionRequest,
  Prescription,
  PrescriptionWorkflowRequest,
  UpdatePrescriptionRequest,
} from './prescription.models';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/prescriptions';

  list(params: Record<string, string>): Observable<{
    data: Prescription[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Prescription>(this.basePath, params);
  }

  getById(id: string): Observable<Prescription> {
    return this.api.get<Prescription>(`${this.basePath}/${id}`);
  }

  create(body: CreatePrescriptionRequest): Observable<Prescription> {
    return this.api.post<Prescription>(this.basePath, body);
  }

  update(id: string, body: UpdatePrescriptionRequest): Observable<Prescription> {
    return this.api.patch<Prescription>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }

  activate(id: string, body: PrescriptionWorkflowRequest): Observable<Prescription> {
    return this.api.post<Prescription>(`${this.basePath}/${id}/activate`, body);
  }

  cancel(id: string, body: PrescriptionWorkflowRequest): Observable<Prescription> {
    return this.api.post<Prescription>(`${this.basePath}/${id}/cancel`, body);
  }

  expire(id: string, body: PrescriptionWorkflowRequest): Observable<Prescription> {
    return this.api.post<Prescription>(`${this.basePath}/${id}/expire`, body);
  }
}
