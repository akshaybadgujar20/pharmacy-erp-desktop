import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreatePrinterConfigurationRequest,
  PrinterConfiguration,
  UpdatePrinterConfigurationRequest,
} from './printer-configuration.models';

@Injectable({ providedIn: 'root' })
export class PrinterConfigurationService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/printer-configurations';

  list(params: Record<string, string>): Observable<{
    data: PrinterConfiguration[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<PrinterConfiguration>(this.basePath, params);
  }

  getById(id: string): Observable<PrinterConfiguration> {
    return this.api.get<PrinterConfiguration>(`${this.basePath}/${id}`);
  }

  create(body: CreatePrinterConfigurationRequest): Observable<PrinterConfiguration> {
    return this.api.post<PrinterConfiguration>(this.basePath, body);
  }

  update(id: string, body: UpdatePrinterConfigurationRequest): Observable<PrinterConfiguration> {
    return this.api.patch<PrinterConfiguration>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
