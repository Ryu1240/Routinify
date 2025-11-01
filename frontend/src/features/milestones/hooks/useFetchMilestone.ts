import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Milestone } from '@/types/milestone';
import { milestonesApi } from '../api/milestonesApi';

export const useFetchMilestone = (id: number | null) => {
  const { isAuthenticated, accessToken } = useAuth();
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestone = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setMilestone(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await milestonesApi.getById(id);
      setMilestone(data);
    } catch (err) {
      console.error('マイルストーンの取得に失敗しました:', err);
      setError(
        'マイルストーンの取得に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      setMilestone(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && accessToken && id) {
      fetchMilestone();
    } else if (!isAuthenticated) {
      setLoading(false);
      setMilestone(null);
      setError(null);
    }
  }, [isAuthenticated, accessToken, id, fetchMilestone]);

  const refreshMilestone = useCallback(async () => {
    await fetchMilestone();
  }, [fetchMilestone]);

  return {
    milestone,
    loading,
    error,
    refreshMilestone,
  };
};
