import axios from 'axios';
import { notifications } from '@mantine/notifications';

// APIのベースURLを設定
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// axiosのデフォルト設定
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 10000;

// リクエストインターセプター
axios.interceptors.request.use(
  (config) => {
    // アクセストークンがある場合は自動的に追加
    const token = localStorage.getItem('access_token');
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
      localStorage.removeItem('access_token');
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
