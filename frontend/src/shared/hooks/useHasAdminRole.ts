import { useAuth } from './useAuth';

/**
 * admin権限チェック用のヘルパーフック
 * ローディング中は常にfalseを返す（デフォルトで非表示）
 */
export const useHasAdminRole = (): boolean => {
  const { isAdmin, isLoading } = useAuth();
  // ローディング中は常にfalse（管理者メニューを非表示）
  if (isLoading) {
    return false;
  }
  return isAdmin;
};
