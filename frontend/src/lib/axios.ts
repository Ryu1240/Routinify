import axios from 'axios';
import { notifications } from '@mantine/notifications';

// APIのベースURLを設定
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// axiosのデフォルト設定
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 10000;

// トークンをメモリ内に保存（axiosインターセプターで使用）
// Auth0 SDKがlocalStorageにトークンを保存・管理（内部管理）
// このメモリ内トークンはuseAuthフックによってAuth0 SDKから取得したトークンで更新される
let memoryToken: string | null = null;

/**
 * メモリ内のトークンを設定（useAuthフックから呼び出される）
 * @param token アクセストークン
 */
export const setMemoryToken = (token: string | null): void => {
  memoryToken = token;
};

/**
 * メモリ内のトークンを取得
 * @returns アクセストークン
 */
export const getMemoryToken = (): string | null => {
  return memoryToken;
};

// リクエストインターセプター
axios.interceptors.request.use(
  (config) => {
    // メモリ内のトークンを使用（useAuthフックがAuth0 SDKから取得したトークンを設定）
    // Auth0 SDKはlocalStorageにトークンを保存・管理（リフレッシュトークンのローテーション対応）
    const token = getMemoryToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    // 401エラーの場合はログインページにリダイレクト
    if (status === 401) {
      // メモリ内のトークンをクリア
      // Auth0 SDKがlocalStorage内のトークンを自動的にクリアするため、手動で削除する必要はない
      setMemoryToken(null);
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 500/503エラーはサーバーエラーとして通知
    // ただし、ログインAPIの場合は個別に処理するため通知をスキップ
    if ((status === 500 || status === 503) && !url?.includes('/auth/login')) {
      const message =
        error.response?.data?.message ||
        'サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。';

      notifications.show({
        title: 'サーバーエラー',
        message: message,
        color: 'red',
        autoClose: 5000,
      });
    }

    return Promise.reject(error);
  }
);

export default axios;
