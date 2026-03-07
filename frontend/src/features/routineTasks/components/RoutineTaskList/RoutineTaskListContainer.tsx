import React from 'react';
import { useRoutineTasks } from '@/shared/hooks';
import { handleApiError } from '@/shared/utils/apiErrorUtils';
import { RoutineTaskList } from './RoutineTaskList';

export const RoutineTaskListContainer: React.FC = () => {
  const {
    routineTasks,
    loading,
    error,
    refreshRoutineTasks,
    deleteRoutineTask,
  } = useRoutineTasks();

  const handleDelete = async (id: number) => {
    try {
      await deleteRoutineTask(id);
    } catch (error) {
      handleApiError(error, {
        defaultMessage:
          '習慣化タスクの削除に失敗しました。しばらく時間をおいて再度お試しください。',
      });
    }
  };

  return (
    <RoutineTaskList
      routineTasks={routineTasks}
      loading={loading}
      error={error}
      onRetry={refreshRoutineTasks}
      onDelete={handleDelete}
    />
  );
};
