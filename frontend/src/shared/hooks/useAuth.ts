import { useAuth0 } from '@auth0/auth0-react';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { authApi } from '@/features/auth/api/authApi';

export const useAuth = () => {
  const {
    isAuthenticated,
    isLoading,
    user,
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Auth0トークンを取得
  useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated && !isLoading && !accessToken) {
        try {
          setTokenLoading(true);
          const token = await getAccessTokenSilently();
          setAccessToken(token);
          // localStorageにも保存（axios設定との互換性のため）
          localStorage.setItem('access_token', token);
        } catch (error) {
          console.error('トークンの取得に失敗しました:', error);
          // トークン取得に失敗した場合は再ログインを促す
          auth0Logout();
        } finally {
          setTokenLoading(false);
        }
      }
    };

    getToken();
  }, [
    isAuthenticated,
    isLoading,
    accessToken,
    getAccessTokenSilently,
    auth0Logout,
  ]);

  // Auth0認証完了後、ロール情報を取得
  useEffect(() => {
    const fetchRoles = async () => {
      if (isAuthenticated && !isLoading && accessToken) {
        try {
          const response = await authApi.login(accessToken);
          setUserRoles(response.user.roles);
          setIsAdmin(response.user.roles.includes('admin'));
        } catch (error) {
          console.error('Failed to get role info:', error);

          // エラー種別に応じた処理
          if (axios.isAxiosError(error)) {
            const status = error.response?.status;

            if (status === 500 || status === 503) {
              // サーバーエラー: 一時的なエラーの可能性
              notifications.show({
                title: 'サーバーエラー',
                message:
                  'サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。',
                color: 'red',
                autoClose: 5000,
              });
            } else if (status === 401) {
              // 認証エラー: トークンが無効
              notifications.show({
                title: '認証エラー',
                message:
                  '認証に失敗しました。もう一度ログインをお試しください。',
                color: 'red',
                autoClose: 5000,
              });
              // トークンをクリアして再ログインを促す
              localStorage.removeItem('access_token');
              setAccessToken(null);
              auth0Logout();
            }
          }
        }
      }
    };

    fetchRoles();
  }, [isAuthenticated, isLoading, accessToken, auth0Logout]);

  const login = useCallback(() => {
    loginWithRedirect();
  }, [loginWithRedirect]);

  const handleLogout = useCallback(async () => {
    try {
      if (accessToken) {
        await authApi.logout();
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('access_token');
      setAccessToken(null);
      setUserRoles([]);
      setIsAdmin(false);
      await auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    }
  }, [accessToken, auth0Logout]);

  return {
    isAuthenticated: isAuthenticated && !!accessToken,
    isLoading: isLoading || tokenLoading,
    user,
    accessToken,
    userRoles,
    isAdmin,
    login,
    logout: handleLogout,
  };
};
