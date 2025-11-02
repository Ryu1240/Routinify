import { useState, useEffect, useCallback } from 'react';
import { AchievementStats } from '@/types/achievement';
import { getAchievementStats } from '../api/achievementsApi';
import { PeriodType } from '../components/PeriodSelector';

export const useAchievementStats = (
  routineTaskId: number,
  period: PeriodType,
  startDate?: string | null,
  endDate?: string | null
) => {
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!routineTaskId) return;

    try {
      setLoading(true);
      setError(null);

      const params: {
        period?: 'weekly' | 'monthly' | 'custom';
        start_date?: string;
        end_date?: string;
      } = {
        period,
      };

      if (period === 'custom') {
        if (!startDate || !endDate) {
          setError('特定期間を選択する場合は開始日と終了日を指定してください');
          setLoading(false);
          return;
        }
        params.start_date = startDate;
        params.end_date = endDate;
      } else if (period === 'weekly' || period === 'monthly') {
        // 週次・月次の場合も、指定された期間のstartDateとendDateを渡す
        if (startDate && endDate) {
          params.start_date = startDate;
          params.end_date = endDate;
        }
      }

      const data = await getAchievementStats(routineTaskId, params);
      setStats(data);
    } catch (err) {
      console.error('達成状況の取得に失敗しました:', err);
      setError('達成状況の取得に失敗しました。');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [routineTaskId, period, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};
