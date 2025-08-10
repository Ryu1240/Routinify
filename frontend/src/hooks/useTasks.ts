import { useState, useEffect, useCallback } from 'react';
import axios from '../config/axios';
import { useAuth } from './useAuth';
import { Task, CreateTaskData } from '../components/tasks/definitions/types';

export const useTasks = () => {
  const { isAuthenticated, accessToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof Task | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
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

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/tasks');
      setTasks(response.data.data);
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

  const filterAndSortTasks = useCallback(() => {
    let filtered = tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.category &&
          task.category.toLowerCase().includes(search.toLowerCase())) ||
        (task.status &&
          task.status.toLowerCase().includes(search.toLowerCase()))
    );

    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return reverseSortDirection ? -comparison : comparison;
      });
    }

    setFilteredTasks(filtered);
  }, [tasks, search, sortBy, reverseSortDirection]);

  useEffect(() => {
    filterAndSortTasks();
  }, [filterAndSortTasks]);

  const setSorting = (field: keyof Task) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
  };

  const refreshTasks = () => {
    fetchTasks();
  };

  const createTask = async (taskData: CreateTaskData) => {
    try {
      setCreateLoading(true);
      setError(null);

      const response = await axios.post('/api/v1/tasks', {
        task: {
          title: taskData.title,
          due_date: taskData.dueDate,
          status: taskData.status,
          priority: taskData.priority,
          category: taskData.category,
        },
      });

      // 作成されたタスクを既存のリストに追加
      setTasks((prevTasks) => [response.data, ...prevTasks]);
    } catch (err) {
      console.error('タスクの作成に失敗しました:', err);
      setError(
        'タスクの作成に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setCreateLoading(false);
    }
  };

  return {
    tasks,
    filteredTasks,
    search,
    setSearch,
    sortBy,
    reverseSortDirection,
    loading,
    createLoading,
    error,
    setSorting,
    refreshTasks,
    createTask,
  };
};
