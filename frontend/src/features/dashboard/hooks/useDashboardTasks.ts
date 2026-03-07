import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Task, TaskStatus } from '@/types';
import { handleApiError } from '@/shared/utils/apiErrorUtils';
import { tasksApi } from '@/features/tasks/api/tasksApi';

export const useDashboardTasks = () => {
  const { isAuthenticated, hasAccessToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      // 未完了または進行中のタスクを期限が近い順に取得
      const data = await tasksApi.fetchAll({
        statuses: 'pending,in_progress',
        sort_by: 'due_date',
        sort_order: 'asc',
      });
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
  }, []);

  useEffect(() => {
    if (hasAccessToken) {
      fetchTasks();
    } else if (!isAuthenticated) {
      setLoading(false);
      setTasks([]);
      setError(null);
    }
  }, [isAuthenticated, hasAccessToken, fetchTasks]);

  const updateTask = useCallback(
    async (taskId: number, taskData: { status?: TaskStatus }) => {
      try {
        await tasksApi.update(taskId, taskData);
        // タスクを再取得
        await fetchTasks();
      } catch (err) {
        handleApiError(err, {
          defaultMessage:
            'タスクの更新に失敗しました。しばらく時間をおいて再度お試しください。',
        });
        throw err;
      }
    },
    [fetchTasks]
  );

  const toggleTaskStatus = useCallback(
    async (taskId: number, currentStatus: TaskStatus | null) => {
      try {
        // 完了と進行中を切り替え
        let newStatus: TaskStatus;
        if (currentStatus === 'completed') {
          newStatus = 'in_progress';
        } else if (currentStatus === 'in_progress') {
          newStatus = 'completed';
        } else {
          // その他の状態（pending, on_hold）の場合は進行中に
          newStatus = 'in_progress';
        }

        await updateTask(taskId, { status: newStatus });
      } catch (err) {
        handleApiError(err, {
          defaultMessage:
            'タスクの更新に失敗しました。しばらく時間をおいて再度お試しください。',
        });
        throw err;
      }
    },
    [updateTask]
  );

  const setTaskStatusToCompleted = useCallback(
    async (taskId: number) => {
      try {
        await updateTask(taskId, { status: 'completed' });
      } catch (err) {
        handleApiError(err, {
          defaultMessage:
            'タスクの更新に失敗しました。しばらく時間をおいて再度お試しください。',
        });
        throw err;
      }
    },
    [updateTask]
  );

  const setTaskStatusToPending = useCallback(
    async (taskId: number) => {
      try {
        await updateTask(taskId, { status: 'pending' });
      } catch (err) {
        handleApiError(err, {
          defaultMessage:
            'タスクの更新に失敗しました。しばらく時間をおいて再度お試しください。',
        });
        throw err;
      }
    },
    [updateTask]
  );

  return {
    tasks,
    loading,
    error,
    toggleTaskStatus,
    setTaskStatusToCompleted,
    setTaskStatusToPending,
    refreshTasks: fetchTasks,
  };
};
