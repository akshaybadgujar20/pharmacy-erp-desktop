export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: { code: string; message: string; details?: unknown };
}
