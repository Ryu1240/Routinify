import { useState, useEffect, useCallback } from 'react';
import { RoutineTaskWithStats } from '@/types/achievement';
import { handleApiError } from '@/shared/utils/apiErrorUtils';
import { getAllRoutineTasksWithStats } from '../api/achievementsApi';

export const useAchievementsList = () => {
  const [routineTasksWithStats, setRoutineTasksWithStats] = useState<
    RoutineTaskWithStats[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievementsList = useCallback(async (silent?: boolean) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const data = await getAllRoutineTasksWithStats();
      setRoutineTasksWithStats(data);
    } catch (err) {
      handleApiError(err, {
        defaultMessage: '達成状況一覧の取得に失敗しました。',
      });
      setError('達成状況一覧の取得に失敗しました。');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchAchievementsList();
  }, [fetchAchievementsList]);

  // カスタムイベントをリッスンして達成状況一覧を更新
  useEffect(() => {
    const handleTasksRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ silent?: boolean }>;
      if (customEvent.detail?.silent) {
        fetchAchievementsList(true);
      } else {
        fetchAchievementsList();
      }
    };

    window.addEventListener('tasks-refresh', handleTasksRefresh);

    return () => {
      window.removeEventListener('tasks-refresh', handleTasksRefresh);
    };
  }, [fetchAchievementsList]);

  return {
    routineTasksWithStats,
    loading,
    error,
    refetch: fetchAchievementsList,
  };
};
