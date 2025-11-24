import { useAuth } from './useAuth';

/**
 * admin権限チェック用のヘルパーフック
 * localStorageから復元されたロール情報がある場合は、ローディング中でも判定可能
 * トークンから取得したロール情報がある場合も、ローディング中でも判定可能
 * ただし、APIからロール情報を取得している最中（rolesLoading）の場合は、ローディング中とみなす
 */
export const useHasAdminRole = (): {
  hasAdminRole: boolean;
  isLoading: boolean;
} => {
  const { isAdmin, isLoading, userRoles, rolesLoading } = useAuth();

  // APIからロール情報を取得している最中は、ローディング中とみなす
  // （APIから取得したロール情報の方が優先されるため）
  if (rolesLoading) {
    return {
      hasAdminRole: false,
      isLoading: true,
    };
  }

  // ロール情報が既に設定されている場合（localStorageから復元済み、またはトークンから取得済み、またはAPIから取得済み）
  // この場合は、判定可能
  if (userRoles.length > 0) {
    return {
      hasAdminRole: isAdmin,
      isLoading: false, // ロール情報が既にある場合はローディング完了とみなす
    };
  }

  // ロール情報が未設定で、Auth0の認証ローディングまたはトークン取得ローディング中は待機
  if (isLoading) {
    return {
      hasAdminRole: false,
      isLoading: true,
    };
  }

  // ローディング完了後、ロール情報が未設定の場合はfalse
  return {
    hasAdminRole: false,
    isLoading: false,
  };
};
