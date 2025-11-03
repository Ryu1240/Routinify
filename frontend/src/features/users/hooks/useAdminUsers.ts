import { useState, useEffect, useCallback } from 'react';
import { adminUserApi, AdminUser, UserListParams } from '../api/adminUserApi';

export const useAdminUsers = (initialParams?: UserListParams) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState<UserListParams>(initialParams || {});

  const fetchUsers = useCallback(
    async (fetchParams?: UserListParams) => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminUserApi.list(fetchParams || params);
        setUsers(response.data);
        setTotal(response.total);
      } catch (err) {
        console.error('ユーザーリストの取得に失敗しました:', err);
        setError('ユーザーリストの取得に失敗しました。しばらく時間をおいて再度お試しください。');
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  const deleteUser = useCallback(async (userId: string) => {
    try {
      setError(null);
      await adminUserApi.delete(userId);
      // 削除後、リストを更新
      await fetchUsers();
    } catch (err) {
      console.error('ユーザーの削除に失敗しました:', err);
      const errorMessage = 'ユーザーの削除に失敗しました。しばらく時間をおいて再度お試しください。';
      setError(errorMessage);
      throw err;
    }
  }, [fetchUsers]);

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

