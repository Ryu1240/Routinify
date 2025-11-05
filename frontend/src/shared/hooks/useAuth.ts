import { useAuth0 } from '@auth0/auth0-react';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { authApi } from '@/features/auth/api/authApi';
import {
  getPermissionsFromToken,
  hasPermissions,
} from '@/shared/utils/tokenUtils';
import { setMemoryToken } from '@/lib/axios';

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
  const [userRoles, setUserRoles] = useState<string[]>(() => {
    // localStorageからロール情報を復元
    const stored = localStorage.getItem('user_roles');
    return stored ? JSON.parse(stored) : [];
  });
  // userRolesから自動的に計算する（初期化時もlocalStorageから復元された値を反映）
  const isAdmin = userRoles.includes('admin');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  // Auth0トークンを取得
  useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated && !isLoading && !accessToken) {
        try {
          setTokenLoading(true);
          // Auth0 SDKが自動的にリフレッシュトークンを使用してトークンを取得・更新
          // ページリロード後もAuth0 SDKがlocalStorageからトークンを復元し、必要に応じてリフレッシュ
          const token = await getAccessTokenSilently();
          setAccessToken(token);
          // メモリ内に保存（axiosインターセプターで使用）
          // Auth0 SDKはlocalStorageにトークンを保存（内部管理）
          setMemoryToken(token);

          // トークンからパーミッション（スコープ）を取得
          // トークンが無効な場合は空配列を返す
          if (token) {
            const permissions = getPermissionsFromToken(token);
            setUserPermissions(permissions);
          } else {
            setUserPermissions([]);
          }
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

  // 認証が解除された時に状態をクリア
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      // 認証が解除された場合、すべての認証関連データを削除
      setMemoryToken(null); // メモリ内のトークンもクリア
      // Auth0 SDKがlocalStorage内のトークンを自動的にクリアするため、手動で削除する必要はない
      // ただし、user_rolesは手動で削除
      localStorage.removeItem('user_roles');
      setAccessToken(null);
      setUserRoles([]);
      setUserPermissions([]);
    }
  }, [isAuthenticated, isLoading]);

  // Auth0認証完了後、ロール情報を取得
  useEffect(() => {
    const fetchRoles = async () => {
      if (isAuthenticated && !isLoading && accessToken) {
        try {
          const response = await authApi.login(accessToken);
          const roles = response.user.roles;
          setUserRoles(roles);
          // localStorageにロール情報を永続化
          localStorage.setItem('user_roles', JSON.stringify(roles));
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
              // サーバーエラーの場合、localStorageから復元したロール情報を使用
              const stored = localStorage.getItem('user_roles');
              if (stored) {
                const roles = JSON.parse(stored) as string[];
                setUserRoles(roles);
              }
            } else if (status === 401) {
              // 認証エラー: トークンが無効
              notifications.show({
                title: '認証エラー',
                message:
                  '認証に失敗しました。もう一度ログインをお試しください。',
                color: 'red',
                autoClose: 5000,
              });
              // トークンとロール情報をクリアして再ログインを促す
              setMemoryToken(null); // メモリ内のトークンもクリア
              // Auth0 SDKがlocalStorage内のトークンを自動的にクリアするため、手動で削除する必要はない
              localStorage.removeItem('user_roles');
              setAccessToken(null);
              setUserRoles([]);
              auth0Logout();
            }
          }
        }
      }
      // トークンがまだない場合は、localStorageから復元しない
      // APIから確実にロール情報を取得するまで待つ
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
      // ログアウト時は必ず認証関連データを削除
      setMemoryToken(null); // メモリ内のトークンもクリア
      // Auth0 SDKがlocalStorage内のトークンを自動的にクリアするため、手動で削除する必要はない
      localStorage.removeItem('user_roles');
      setAccessToken(null);
      setUserRoles([]);
      setUserPermissions([]);
      await auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    }
  }, [accessToken, auth0Logout]);

  /**
   * 特定のパーミッションを持っているかチェック
   * @param requiredPermissions 必要なパーミッションの配列
   * @returns すべてのパーミッションを持っている場合true
   */
  const checkPermissions = useCallback(
    (requiredPermissions: string[]): boolean => {
      return hasPermissions(accessToken, requiredPermissions);
    },
    [accessToken]
  );

  return {
    isAuthenticated, // Auth0の認証状態のみを反映
    hasAccessToken: !!accessToken, // トークンが存在するかどうか
    isLoading: isLoading || tokenLoading,
    user,
    accessToken,
    userRoles,
    isAdmin,
    userPermissions, // パーミッション（スコープ）の配列
    checkPermissions, // パーミッションチェック関数
    login,
    logout: handleLogout,
  };
};
