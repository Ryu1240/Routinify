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
    const response = await axios.post<{
      success: boolean;
      data: LoginResponse;
    }>('/api/v1/auth/login', {
      auth0_token: auth0Token,
    });
    // バックエンドは { success: true, data: { user: {...} } } を返す
    if (!response.data.data || !response.data.data.user) {
      throw new Error('Invalid response structure from login API');
    }
    return response.data.data;
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
