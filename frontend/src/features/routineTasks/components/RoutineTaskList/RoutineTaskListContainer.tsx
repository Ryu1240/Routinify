import React from 'react';
import { useRoutineTasks } from '@/shared/hooks';
import { RoutineTaskList } from './RoutineTaskList';

export const RoutineTaskListContainer: React.FC = () => {
  const { routineTasks, loading, error, deleteRoutineTask } = useRoutineTasks();

  const handleDelete = async (id: number) => {
    try {
      await deleteRoutineTask(id);
    } catch (error) {
      console.error('習慣化タスク削除に失敗:', error);
    }
  };

  return (
    <RoutineTaskList
      routineTasks={routineTasks}
      loading={loading}
      error={error}
      onDelete={handleDelete}
    />
  );
};
