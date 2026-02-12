export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: { field: string; message: string }[];
  correlationId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    cursor: string | null;
    hasMore: boolean;
    total: number;
  };
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}
