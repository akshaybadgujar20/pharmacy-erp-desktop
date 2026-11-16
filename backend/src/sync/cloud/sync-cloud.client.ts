import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type {
  SyncCloudPullResponse,
  SyncCloudPushRequest,
  SyncCloudPushResponse,
  SyncCloudRequestContext,
} from './sync-cloud.contract';
import {
  getSyncCloudBaseUrl,
  getSyncPullPageLimit,
  getSyncRequestTimeoutMs,
} from './sync-cloud.config';

@Injectable()
export class SyncCloudClient {
  private buildHeaders(ctx: SyncCloudRequestContext): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (ctx.authorization?.trim()) {
      headers.Authorization = ctx.authorization.trim();
    }
    headers['X-Device-Id'] = ctx.deviceId;
    if (ctx.branchId != null) {
      headers['X-Branch-Id'] = ctx.branchId.toString();
    }
    if (ctx.companyId != null) {
      headers['X-Company-Id'] = ctx.companyId.toString();
    }
    return headers;
  }

  private baseUrl(): string {
    const base = getSyncCloudBaseUrl();
    if (!base) {
      throw new ApplicationException(
        ErrorCode.SYNC_CLOUD_URL_NOT_CONFIGURED,
        'SYNC_CLOUD_URL is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return base.replace(/\/$/, '');
  }

  async pushBatch(
    ctx: SyncCloudRequestContext,
    body: SyncCloudPushRequest,
  ): Promise<SyncCloudPushResponse> {
    const url = `${this.baseUrl()}/push`;
    const response = await this.fetchJson(url, {
      method: 'POST',
      headers: {
        ...this.buildHeaders(ctx),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(response.text || `HTTP ${response.status}`);
    }
    return response.json as SyncCloudPushResponse;
  }

  async pullDelta(
    ctx: SyncCloudRequestContext,
    cursor: string | null,
    limit = getSyncPullPageLimit(),
  ): Promise<SyncCloudPullResponse> {
    const params = new URLSearchParams();
    params.set('deviceId', ctx.deviceId);
    if (ctx.branchId != null) {
      params.set('branchId', ctx.branchId.toString());
    }
    if (cursor) {
      params.set('cursor', cursor);
    }
    params.set('limit', String(limit));

    const url = `${this.baseUrl()}/pull?${params.toString()}`;
    const response = await this.fetchJson(url, {
      method: 'GET',
      headers: this.buildHeaders(ctx),
    });
    if (!response.ok) {
      throw new Error(response.text || `HTTP ${response.status}`);
    }
    const json = response.json as SyncCloudPullResponse;
    return {
      records: Array.isArray(json.records) ? json.records : [],
      nextCursor: json.nextCursor ?? null,
      hasMore: Boolean(json.hasMore),
    };
  }

  private async fetchJson(
    url: string,
    init: RequestInit,
  ): Promise<{ ok: boolean; status: number; text: string; json: unknown }> {
    const timeoutMs = getSyncRequestTimeoutMs();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      const text = await response.text();
      let json: unknown = {};
      if (text) {
        try {
          json = JSON.parse(text) as unknown;
        } catch {
          json = {};
        }
      }
      return { ok: response.ok, status: response.status, text, json };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown sync HTTP error';
      throw new Error(message);
    } finally {
      clearTimeout(timer);
    }
  }
}
