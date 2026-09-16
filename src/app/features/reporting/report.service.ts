import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  ApiClientError,
  ApiResponse,
} from '../../core/models/api-response.types';
import { unwrapApiResponse } from '../../core/services/api.service';
import {
  ReportDefinitionMeta,
  ReportRunResult,
} from './report.models';

interface ReportDataPayload {
  columns: ReportRunResult['columns'];
  rows: Record<string, unknown>[];
  totals?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000';
  private readonly basePath = '/reports';

  list(): Observable<ReportDefinitionMeta[]> {
    return this.http
      .get<ApiResponse<ReportDefinitionMeta[]>>(`${this.baseUrl}${this.basePath}`)
      .pipe(map((response) => unwrapApiResponse(response)));
  }

  run(reportId: string, params: Record<string, string>): Observable<ReportRunResult> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http
      .get<ApiResponse<ReportDataPayload | Record<string, unknown>[]>>(
        `${this.baseUrl}${this.basePath}/${reportId}`,
        { params: httpParams },
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new ApiClientError(
              response.error.code,
              response.error.message,
              response.error.details,
            );
          }

          if (response.pagination) {
            const rows = response.data as Record<string, unknown>[];
            return {
              columns: this.deriveColumns(rows),
              rows,
              pagination: response.pagination,
            };
          }

          const payload = response.data as ReportDataPayload;
          return {
            columns: payload.columns,
            rows: payload.rows,
            totals: payload.totals,
          };
        }),
      );
  }

  private deriveColumns(rows: Record<string, unknown>[]): ReportRunResult['columns'] {
    const firstRow = rows[0];
    if (!firstRow) {
      return [];
    }

    return Object.keys(firstRow).map((key) => ({
      key,
      label: key,
      type: 'string',
    }));
  }
}
