import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { adminUserApi, AdminUser, UserListParams } from '../api/adminUserApi';

export const useAdminUsers = (initialParams?: UserListParams) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState<UserListParams>(initialParams || {});
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const fetchUsers = useCallback(
    async (fetchParams?: UserListParams) => {
      // 既に権限がないことが判明している場合、再試行しない
      if (hasPermission === false) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await adminUserApi.list(fetchParams || params);
        setUsers(response.data);
        setTotal(response.total);
        setHasPermission(true);
      } catch (err) {
        console.error('ユーザーリストの取得に失敗しました:', err);

        // 403エラーの場合、権限がないと判定
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setError(
            '権限がありません。このページにアクセスするには管理者権限が必要です。'
          );
          setHasPermission(false);
          setUsers([]);
          setTotal(0);
        } else {
          setError(
            'ユーザーリストの取得に失敗しました。しばらく時間をおいて再度お試しください。'
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [params, hasPermission]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        setError(null);
        await adminUserApi.delete(userId);
        // 削除後、リストを更新
        await fetchUsers();
      } catch (err) {
        console.error('ユーザーの削除に失敗しました:', err);
        const errorMessage =
          'ユーザーの削除に失敗しました。しばらく時間をおいて再度お試しください。';
        setError(errorMessage);
        throw err;
      }
    },
    [fetchUsers]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    total,
    params,
    setParams,
    refetch: fetchUsers,
    deleteUser,
  };
};
