import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';

export const useAuth = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    getAccessTokenSilently, 
    loginWithRedirect,
    logout 
  } = useAuth0();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated && !accessToken) {
        try {
          setTokenLoading(true);
          const token = await getAccessTokenSilently();
          setAccessToken(token);
          // localStorageにも保存（axios設定との互換性のため）
          localStorage.setItem('access_token', token);
        } catch (error) {
          console.error('トークンの取得に失敗しました:', error);
          // トークン取得に失敗した場合は再ログインを促す
          logout();
        } finally {
          setTokenLoading(false);
        }
      }
    };

    getToken();
  }, [isAuthenticated, getAccessTokenSilently, accessToken, logout]);

  const login = () => {
    loginWithRedirect();
  };

  const handleLogout = () => {
    setAccessToken(null);
    localStorage.removeItem('access_token');
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return {
    isAuthenticated,
    isLoading: isLoading || tokenLoading,
    accessToken,
    login,
    logout: handleLogout,
  };
}; 