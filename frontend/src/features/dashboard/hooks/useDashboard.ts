import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { getAllRoutineTasksWithStats } from '@/features/achievements/api/achievementsApi';
import { RoutineTaskWithStats } from '@/types/achievement';
import { handleApiError } from '@/shared/utils/apiErrorUtils';

export const useDashboard = () => {
  const { hasAccessToken } = useAuth();
  const [routineTasks, setRoutineTasks] = useState<RoutineTaskWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutineTasks = useCallback(async (silent?: boolean) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const allTasks = await getAllRoutineTasksWithStats('monthly');

      // 上位3つを選択: 達成率が高い順
      const sortedTasks = allTasks.sort((a, b) => {
        // 達成率でソート（降順）
        return (
          (b.achievementStats?.achievementRate || 0) -
          (a.achievementStats?.achievementRate || 0)
        );
      });

      // 上位3つを取得（3つ未満の場合は全て）
      const topThree = sortedTasks.slice(0, 3);
      setRoutineTasks(topThree);
      setError(null);
    } catch (err) {
      handleApiError(err, {
        defaultMessage:
          '習慣化タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。',
      });
      setError(
        '習慣化タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (hasAccessToken) {
      fetchRoutineTasks();
    } else {
      setLoading(false);
      setRoutineTasks([]);
      setError(null);
    }
  }, [hasAccessToken, fetchRoutineTasks]);

  return {
    routineTasks,
    loading,
    error,
    refetchRoutineTasks: fetchRoutineTasks,
  };
};
