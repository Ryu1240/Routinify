import axios from 'axios';

// APIのベースURLを設定
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

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
    // 401エラーの場合はログインページにリダイレクト
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios; 