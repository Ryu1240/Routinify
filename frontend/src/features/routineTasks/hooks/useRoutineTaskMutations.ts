import { useState } from 'react';
import { CreateRoutineTaskDto, UpdateRoutineTaskDto } from '@/types';
import { routineTasksApi } from '../api/routineTasksApi';

export const useRoutineTaskMutations = (onRefresh: () => void) => {
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoutineTask = async (routineTaskData: CreateRoutineTaskDto) => {
    try {
      setCreateLoading(true);
      setError(null);

      await routineTasksApi.create(routineTaskData);

      // 作成後に習慣化タスクリストを再取得
      onRefresh();
    } catch (err) {
      console.error('習慣化タスクの作成に失敗しました:', err);
      setError(
        '習慣化タスクの作成に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setCreateLoading(false);
    }
  };

  const updateRoutineTask = async (
    routineTaskId: number,
    routineTaskData: UpdateRoutineTaskDto
  ) => {
    try {
      setUpdateLoading(true);
      setError(null);

      await routineTasksApi.update(routineTaskId, routineTaskData);

      // 更新後に習慣化タスクリストを再取得
      onRefresh();
    } catch (err) {
      console.error('習慣化タスクの更新に失敗しました:', err);
      setError(
        '習慣化タスクの更新に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteRoutineTask = async (routineTaskId: number) => {
    try {
      setDeleteLoading(true);
      setError(null);

      await routineTasksApi.delete(routineTaskId);

      // 削除後に習慣化タスクリストを再取得
      onRefresh();
    } catch (err) {
      console.error('習慣化タスクの削除に失敗しました:', err);
      setError(
        '習慣化タスクの削除に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setDeleteLoading(false);
    }
  };

  return {
    createRoutineTask,
    updateRoutineTask,
    deleteRoutineTask,
    createLoading,
    updateLoading,
    deleteLoading,
    error,
  };
};
