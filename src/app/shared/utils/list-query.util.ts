export function toListParams(
  page: number,
  pageSize: number,
  search?: string,
): Record<string, string> {
  return {
    page: String(page),
    pageSize: String(pageSize),
    ...(search ? { search } : {}),
  };
}
