import { useState } from 'react';
import { CreateTaskDto, UpdateTaskDto } from '@/types';
import { tasksApi } from '../api/tasksApi';

export const useTaskMutations = (onRefresh: () => void) => {
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = async (taskData: CreateTaskDto) => {
    try {
      setCreateLoading(true);
      setError(null);

      await tasksApi.create(taskData);

      // 作成後にタスクリストを再取得
      onRefresh();
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
      onRefresh();
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
      setDeleteLoading(true);
      setError(null);

      await tasksApi.delete(taskId);

      // 削除後にタスクリストを再取得
      onRefresh();
    } catch (err) {
      console.error('タスクの削除に失敗しました:', err);
      setError(
        'タスクの削除に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setDeleteLoading(false);
    }
  };

  return {
    createTask,
    updateTask,
    deleteTask,
    createLoading,
    updateLoading,
    deleteLoading,
    error,
  };
};
