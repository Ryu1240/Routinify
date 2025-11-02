import { useState, useEffect, useCallback } from 'react';
import { AchievementTrendData } from '@/types/achievement';
import { getAchievementTrend } from '../api/achievementsApi';

export const useAchievementTrend = (
  routineTaskId: number,
  period: 'weekly' | 'monthly',
  count: number
) => {
  const [data, setData] = useState<AchievementTrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrend = useCallback(async () => {
    if (!routineTaskId || routineTaskId === 0) return;

    try {
      setLoading(true);
      setError(null);

      const params: {
        period: 'weekly' | 'monthly';
        weeks?: number;
        months?: number;
      } = {
        period,
      };

      if (period === 'weekly') {
        params.weeks = count;
      } else {
        params.months = count;
      }

      const trendData = await getAchievementTrend(routineTaskId, params);
      setData(trendData);
    } catch (err) {
      console.error('達成率推移の取得に失敗しました:', err);
      setError('達成率推移の取得に失敗しました。');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [routineTaskId, period, count]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  return {
    data,
    loading,
    error,
    refetch: fetchTrend,
  };
};

