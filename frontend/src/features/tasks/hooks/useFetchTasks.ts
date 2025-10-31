import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Task } from '@/types';
import { tasksApi } from '../api/tasksApi';

export const useFetchTasks = () => {
  const { isAuthenticated, accessToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.fetchAll();
      setTasks(data);
      setError(null);
    } catch (err) {
      console.error('タスクの取得に失敗しました:', err);
      setError(
        'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshTasks = useCallback(async () => {
    try {
      setLoading(true);
      // リフレッシュ時はキャッシュを無効化して最新データを取得
      const data = await tasksApi.fetchAll(true);
      setTasks(data);
      setError(null);
    } catch (err) {
      console.error('タスクの取得に失敗しました:', err);
      setError(
        'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchTasks();
    } else if (!isAuthenticated) {
      setLoading(false);
      setTasks([]);
      setError(null);
    }
  }, [isAuthenticated, accessToken]);

  // カスタムイベントをリッスンしてタスクリストを更新
  useEffect(() => {
    const handleTasksRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ silent?: boolean }>;
      // silentフラグが設定されている場合は、ローディング状態を表示しない
      if (customEvent.detail?.silent) {
        // 静かに更新（ローディング状態を変更しない）
        tasksApi.fetchAll(true).then((data) => {
          setTasks(data);
          setError(null);
        }).catch((err) => {
          console.error('タスクの取得に失敗しました:', err);
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
  }, [refreshTasks]);

  return {
    tasks,
    loading,
    error,
    refreshTasks,
  };
};
