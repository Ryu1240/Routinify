import { useState, useEffect } from 'react';
import axios from '../config/axios';
import { useAuth } from './useAuth';

export interface Task {
  id: number;
  accountId: string;
  title: string;
  dueDate: string | null;
  status: string | null;
  priority: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useTasks = () => {
  const { isAuthenticated, accessToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof Task | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchTasks();
    } else if (!isAuthenticated) {
      setLoading(false);
      setTasks([]);
      setError(null);
    }
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    filterAndSortTasks();
  }, [tasks, search, sortBy, reverseSortDirection]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/tasks');
      setTasks(response.data.data);
      setError(null);
    } catch (err) {
      console.error('タスクの取得に失敗しました:', err);
      setError('タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTasks = () => {
    let filtered = tasks.filter((task) =>
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.category && task.category.toLowerCase().includes(search.toLowerCase())) ||
      (task.status && task.status.toLowerCase().includes(search.toLowerCase()))
    );

    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return 1;
        if (bValue === null) return -1;
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return reverseSortDirection ? -comparison : comparison;
      });
    }

    setFilteredTasks(filtered);
  };

  const setSorting = (field: keyof Task) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
  };

  const refreshTasks = () => {
    fetchTasks();
  };

  return {
    tasks,
    filteredTasks,
    search,
    setSearch,
    sortBy,
    reverseSortDirection,
    loading,
    error,
    setSorting,
    refreshTasks,
  };
}; 