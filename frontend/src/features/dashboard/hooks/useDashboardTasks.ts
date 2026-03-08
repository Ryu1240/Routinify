import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Task, TaskStatus } from '@/types';
import { Milestone } from '@/types/milestone';
import { handleApiError } from '@/shared/utils/apiErrorUtils';
import { tasksApi } from '@/features/tasks/api/tasksApi';
import { milestonesApi } from '@/features/milestones/api/milestonesApi';

export const useDashboardTasks = () => {
  const { isAuthenticated, hasAccessToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (silent?: boolean) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      // 未完了または進行中のタスクを期限が近い順に取得
      const data = await tasksApi.fetchAll({
        statuses: 'pending,in_progress',
        sort_by: 'due_date',
        sort_order: 'asc',
      });
      setTasks(data);
      setError(null);

      // マイルストーンに紐づくタスクがある場合、該当マイルストーンを取得
      const milestoneIds = Array.from(
        new Set(data.flatMap((task) => task.milestoneIds ?? []))
      );
      if (milestoneIds.length > 0) {
        const milestonesData = await milestonesApi.getAll({
          ids: milestoneIds,
        });
        setMilestones(milestonesData);
      } else {
        setMilestones([]);
      }
    } catch (err) {
      handleApiError(err, {
        defaultMessage:
          'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。',
      });
      setError(
        'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
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
        // タスクを再取得（ローディングは出さずデータ差し替えのみ）
        await fetchTasks(true);
        // 達成状況など他画面のデータも再取得させる
        window.dispatchEvent(
          new CustomEvent('tasks-refresh', { detail: { silent: true } })
        );
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
    milestones,
    loading,
    error,
    toggleTaskStatus,
    setTaskStatusToCompleted,
    setTaskStatusToPending,
    refreshTasks: fetchTasks,
  };
};
