import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  BarcodeConfiguration,
  CreateBarcodeConfigurationRequest,
  UpdateBarcodeConfigurationRequest,
} from './barcode-configuration.models';

@Injectable({ providedIn: 'root' })
export class BarcodeConfigurationService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/barcode-configurations';

  list(params: Record<string, string>): Observable<{
    data: BarcodeConfiguration[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<BarcodeConfiguration>(this.basePath, params);
  }

  getById(id: string): Observable<BarcodeConfiguration> {
    return this.api.get<BarcodeConfiguration>(`${this.basePath}/${id}`);
  }

  create(body: CreateBarcodeConfigurationRequest): Observable<BarcodeConfiguration> {
    return this.api.post<BarcodeConfiguration>(this.basePath, body);
  }

  update(id: string, body: UpdateBarcodeConfigurationRequest): Observable<BarcodeConfiguration> {
    return this.api.patch<BarcodeConfiguration>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
