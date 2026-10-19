const REPORT_PERMISSION_BY_CODE: Record<string, string> = {
  REPORT_VIEW: 'REPORT:REPORT:READ',
  REPORT_PARTY_VIEW: 'REPORT:PARTY_REPORT:READ',
  REPORT_SALES_VIEW: 'REPORT:SALES_REPORT:READ',
  REPORT_PURCHASE_VIEW: 'REPORT:PURCHASE_REPORT:READ',
  REPORT_INVENTORY_VIEW: 'REPORT:INVENTORY_REPORT:READ',
  REPORT_FINANCE_VIEW: 'REPORT:FINANCE_REPORT:READ',
};

export function toJwtReportPermission(permissionCode: string): string {
  return REPORT_PERMISSION_BY_CODE[permissionCode] ?? permissionCode;
}

export function userCanRunReport(
  userPermissions: string[],
  reportPermissionCode: string,
): boolean {
  return userPermissions.includes(toJwtReportPermission(reportPermissionCode));
}
