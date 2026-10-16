import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface PreCloseBlocker {
  code: string;
  count: number;
  message: string;
}

export interface PreCloseChecklistResult {
  canClose: boolean;
  blockers: PreCloseBlocker[];
}

@Injectable({ providedIn: 'root' })
export class ClosingService {
  private readonly api = inject(ApiService);

  getPreCloseChecklist(branchId?: string) {
    const params: Record<string, string> = {};
    if (branchId) {
      params['branchId'] = branchId;
    }
    return this.api.get<PreCloseChecklistResult>('/closing/pre-close-checklist', params);
  }
}
