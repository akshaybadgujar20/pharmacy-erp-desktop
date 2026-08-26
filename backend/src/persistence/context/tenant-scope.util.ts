import type { RequestContextData } from './request-context';
import { RequestContextService } from './request-context.service';

export interface TenantScope {
  companyId: bigint;
  branchId: bigint;
}

export function getTenantScope(
  requestContext: RequestContextService,
): TenantScope {
  const ctx = requestContext.get();
  if (ctx.companyId == null || ctx.branchId == null) {
    throw new Error('Tenant scope is not available in request context');
  }
  return {
    companyId: ctx.companyId,
    branchId: ctx.branchId,
  };
}

export function withBranchScope<T extends Record<string, unknown>>(
  scope: TenantScope,
  where: T,
): T & { branchId: bigint } {
  return { ...where, branchId: scope.branchId };
}

export function withCompanyScope<T extends Record<string, unknown>>(
  scope: TenantScope,
  where: T,
): T & { companyId: bigint } {
  return { ...where, companyId: scope.companyId };
}

export function isUserContextPopulated(
  ctx: RequestContextData | undefined,
): boolean {
  return (
    ctx?.userId !== undefined &&
    ctx.companyId !== undefined &&
    ctx.branchId !== undefined &&
    ctx.deviceId !== undefined
  );
}
