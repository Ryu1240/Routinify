import { useAuth } from './useAuth';

/**
 * admin権限チェック用のヘルパーフック
 * localStorageから復元されたロール情報がある場合は、ローディング中でも判定可能
 */
export const useHasAdminRole = (): boolean => {
  const { isAdmin, isLoading, userRoles } = useAuth();
  // ロール情報が既に設定されている場合（localStorageから復元済み）、isLoadingに関係なく判定
  if (userRoles.length > 0) {
    return isAdmin;
  }
  // ロール情報が未設定で、ローディング中はfalseを返す
  if (isLoading) {
    return false;
  }
  return isAdmin;
};
