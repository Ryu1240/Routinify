import { useState, useEffect, useCallback } from 'react';
import { RoutineTaskWithStats } from '@/types/achievement';
import { getAllRoutineTasksWithStats } from '../api/achievementsApi';

export const useAchievementsList = () => {
  const [routineTasksWithStats, setRoutineTasksWithStats] = useState<
    RoutineTaskWithStats[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievementsList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAllRoutineTasksWithStats();
      setRoutineTasksWithStats(data);
    } catch (err) {
      console.error('達成状況一覧の取得に失敗しました:', err);
      setError('達成状況一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievementsList();
  }, [fetchAchievementsList]);

  return {
    routineTasksWithStats,
    loading,
    error,
    refetch: fetchAchievementsList,
  };
};
