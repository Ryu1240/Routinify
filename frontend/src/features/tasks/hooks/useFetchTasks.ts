import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Task } from '@/types';
import { handleApiError } from '@/shared/utils/apiErrorUtils';
import { tasksApi } from '../api/tasksApi';

type UseFetchTasksOptions = {
  includeCompleted?: boolean;
};

export const useFetchTasks = (options: UseFetchTasksOptions = {}) => {
  const { includeCompleted = false } = options;
  const { isAuthenticated, hasAccessToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(
    async (skipCache = false) => {
      try {
        setLoading(true);
        const data = await tasksApi.fetchAll(
          { include_completed: includeCompleted },
          skipCache
        );
        setTasks(data);
        setError(null);
      } catch (err) {
        handleApiError(err, {
          defaultMessage:
            'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。',
        });
        setError(
          'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。'
        );
      } finally {
        setLoading(false);
      }
    },
    [includeCompleted]
  );

  const refreshTasks = useCallback(async () => {
    await fetchTasks(true);
  }, [fetchTasks]);

  useEffect(() => {
    if (hasAccessToken) {
      fetchTasks(false);
    } else if (!isAuthenticated) {
      setLoading(false);
      setTasks([]);
      setError(null);
    }
  }, [isAuthenticated, hasAccessToken, fetchTasks]);

  // カスタムイベントをリッスンしてタスクリストを更新
  useEffect(() => {
    const handleTasksRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ silent?: boolean }>;
      // silentフラグが設定されている場合は、ローディング状態を表示しない
      if (customEvent.detail?.silent) {
        // 静かに更新（ローディング状態を変更しない）
        tasksApi
          .fetchAll({ include_completed: includeCompleted }, true)
          .then((data) => {
            setTasks(data);
            setError(null);
          })
          .catch((err) => {
            handleApiError(err, {
              defaultMessage:
                'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。',
            });
            setError(
              'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。'
            );
          });
      } else {
        refreshTasks();
      }
    };

    window.addEventListener('tasks-refresh', handleTasksRefresh);

    return () => {
      window.removeEventListener('tasks-refresh', handleTasksRefresh);
    };
  }, [refreshTasks, includeCompleted]);

  return {
    tasks,
    loading,
    error,
    refreshTasks,
  };
};
