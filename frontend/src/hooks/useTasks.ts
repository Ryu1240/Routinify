import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { Task, CreateTaskDto, UpdateTaskDto } from '../types';
import { tasksApi } from '../features/tasks/api/tasksApi';

export const useTasks = () => {
  const { isAuthenticated, accessToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof Task | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
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

  const filterAndSortTasks = useCallback(() => {
    let filtered = tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(search.toLowerCase()) ||
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

  const createTask = async (taskData: CreateTaskDto) => {
    try {
      setCreateLoading(true);
      setError(null);

      await tasksApi.create(taskData);

      // 作成後にタスクリストを再取得
      await fetchTasks();
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

  const updateTask = async (taskId: number, taskData: UpdateTaskDto) => {
    try {
      setUpdateLoading(true);
      setError(null);

      await tasksApi.update(taskId, taskData);

      // 更新後にタスクリストを再取得
      await fetchTasks();
    } catch (err) {
      console.error('タスクの更新に失敗しました:', err);
      setError(
        'タスクの更新に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      setLoading(true);
      setError(null);

      await tasksApi.delete(taskId);

      // 削除後にタスクリストを再取得
      await fetchTasks();
    } catch (err) {
      console.error('タスクの削除に失敗しました:', err);
      setError(
        'タスクの削除に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setLoading(false);
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
    updateLoading,
    error,
    setSorting,
    refreshTasks,
    createTask,
    updateTask,
    deleteTask,
  };
};
