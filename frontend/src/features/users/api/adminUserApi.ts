import axios from '@/lib/axios';

export type AdminUser = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  nickname?: string;
  emailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  loginsCount?: number;
};

export type UserListResponse = {
  data: AdminUser[];
  total: number;
  start: number;
  limit: number;
};

export type UserListParams = {
  page?: number;
  perPage?: number;
  q?: string;
  sort?: string;
  order?: 'asc' | 'desc';
};

type ApiResponse = {
  success: boolean;
  data: {
    users: AdminUser[];
    total?: number;
    start?: number;
    limit?: number;
  };
};

export const adminUserApi = {
  list: async (params?: UserListParams): Promise<UserListResponse> => {
    // バックエンドはpage, per_pageの形式を期待するため、パラメータを変換
    const queryParams: Record<string, string | number> = {};
    if (params?.page !== undefined) {
      queryParams.page = params.page;
    }
    if (params?.perPage !== undefined) {
      queryParams.per_page = params.perPage;
    }
    if (params?.q) {
      queryParams.q = params.q;
    }
    if (params?.sort) {
      queryParams.sort = params.sort;
    }
    if (params?.order) {
      queryParams.order = params.order;
    }

    const response = await axios.get<ApiResponse>('/api/v1/admin/users', {
      params: queryParams,
    });
    const apiData = response.data.data;
    return {
      data: apiData.users,
      total: apiData.total ?? 0,
      start: apiData.start ?? 0,
      limit: apiData.limit ?? 0,
    };
  },

  delete: async (userId: string): Promise<void> => {
    await axios.delete(`/api/v1/admin/users/${userId}`);
  },
};
