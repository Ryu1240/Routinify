import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Milestone } from '@/types/milestone';
import { milestonesApi } from '../api/milestonesApi';

export const useFetchMilestones = () => {
  const { isAuthenticated, accessToken } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestones = useCallback(
    async (filters?: Parameters<typeof milestonesApi.getAll>[0]) => {
      try {
        setLoading(true);
        const data = await milestonesApi.getAll(filters);
        setMilestones(data);
        setError(null);
      } catch (err) {
        console.error('マイルストーンの取得に失敗しました:', err);
        setError(
          'マイルストーンの取得に失敗しました。しばらく時間をおいて再度お試しください。'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchMilestones();
    } else if (!isAuthenticated) {
      setLoading(false);
      setMilestones([]);
      setError(null);
    }
  }, [isAuthenticated, accessToken, fetchMilestones]);

  const refreshMilestones = useCallback(
    async (filters?: Parameters<typeof milestonesApi.getAll>[0]) => {
      await fetchMilestones(filters);
    },
    [fetchMilestones]
  );

  return {
    milestones,
    loading,
    error,
    refreshMilestones,
    fetchMilestones,
  };
};
