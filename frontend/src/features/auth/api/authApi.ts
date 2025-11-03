import axios from '@/lib/axios';

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}

export interface UserResponse {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}

export const authApi = {
  /**
   * ログイン: Auth0トークンを送信してロール情報を取得
   */
  login: async (auth0Token: string): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>('/api/v1/auth/login', {
      auth0_token: auth0Token,
    });
    return response.data;
  },

  /**
   * ログアウト
   */
  logout: async (): Promise<void> => {
    await axios.post('/api/v1/auth/logout');
  },

  /**
   * 現在のユーザー情報とロール情報を取得
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await axios.get<UserResponse>('/api/v1/auth/me');
    return response.data;
  },
};
