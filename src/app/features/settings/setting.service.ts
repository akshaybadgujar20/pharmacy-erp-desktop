import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AppSetting, UpdateSettingRequest } from './setting.models';

@Injectable({ providedIn: 'root' })
export class SettingService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/settings';

  list(category?: string): Observable<AppSetting[]> {
    const params = category ? { category } : undefined;
    return this.api.get<AppSetting[]>(this.basePath, params);
  }

  getByKey(key: string): Observable<AppSetting> {
    return this.api.get<AppSetting>(`${this.basePath}/${key}`);
  }

  update(key: string, body: UpdateSettingRequest): Observable<AppSetting> {
    return this.api.put<AppSetting>(`${this.basePath}/${key}`, body);
  }
}
