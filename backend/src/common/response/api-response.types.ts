export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: Pagination;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
