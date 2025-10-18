import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Task } from '../../../types';
import { tasksApi } from '../api/tasksApi';

export const useFetchTasks = () => {
  const { isAuthenticated, accessToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.fetchAll();
      setTasks(data);
      setError(null);
    } catch (err) {
      console.error('タスクの取得に失敗しました:', err);
      setError(
        'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchTasks();
    } else if (!isAuthenticated) {
      setLoading(false);
      setTasks([]);
      setError(null);
    }
  }, [isAuthenticated, accessToken]);

  const refreshTasks = () => {
    fetchTasks();
  };

  return {
    tasks,
    loading,
    error,
    refreshTasks,
  };
};
