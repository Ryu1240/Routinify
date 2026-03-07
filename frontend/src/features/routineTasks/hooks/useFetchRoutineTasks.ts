import { useState, useEffect, useCallback } from 'react';
import { RoutineTask } from '@/types';
import { handleApiError } from '@/shared/utils/apiErrorUtils';
import { routineTasksApi } from '../api/routineTasksApi';

export const useFetchRoutineTasks = () => {
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutineTasks = useCallback(async (silent?: boolean) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const data = await routineTasksApi.fetchAll();
      setRoutineTasks(data);
    } catch (err) {
      handleApiError(err, {
        defaultMessage: '習慣化タスクの取得に失敗しました。',
      });
      setError('習慣化タスクの取得に失敗しました。');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchRoutineTasks();
  }, [fetchRoutineTasks]);

  // カスタムイベントをリッスンして習慣化タスク一覧を更新
  useEffect(() => {
    const handleTasksRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ silent?: boolean }>;
      if (customEvent.detail?.silent) {
        fetchRoutineTasks(true);
      } else {
        fetchRoutineTasks();
      }
    };

    window.addEventListener('tasks-refresh', handleTasksRefresh);

    return () => {
      window.removeEventListener('tasks-refresh', handleTasksRefresh);
    };
  }, [fetchRoutineTasks]);

  return {
    routineTasks,
    loading,
    error,
    refreshRoutineTasks: fetchRoutineTasks,
  };
};
