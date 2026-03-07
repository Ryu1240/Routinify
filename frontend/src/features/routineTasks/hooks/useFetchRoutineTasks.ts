import { useState, useEffect, useCallback } from 'react';
import { RoutineTask } from '@/types';
import { handleApiError } from '@/shared/utils/apiErrorUtils';
import { routineTasksApi } from '../api/routineTasksApi';

export const useFetchRoutineTasks = () => {
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutineTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await routineTasksApi.fetchAll();
      setRoutineTasks(data);
    } catch (err) {
      handleApiError(err, {
        defaultMessage: '習慣化タスクの取得に失敗しました。',
      });
      setError('習慣化タスクの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutineTasks();
  }, [fetchRoutineTasks]);

  return {
    routineTasks,
    loading,
    error,
    refreshRoutineTasks: fetchRoutineTasks,
  };
};
