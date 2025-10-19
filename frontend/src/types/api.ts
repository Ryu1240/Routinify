// API共通型定義

export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type ApiError = {
  errors: string[];
  status: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    perPage: number;
  };
};

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
