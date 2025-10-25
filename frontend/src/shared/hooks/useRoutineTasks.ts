import { useFetchRoutineTasks } from '@/features/routineTasks/hooks/useFetchRoutineTasks';
import { useRoutineTaskMutations } from '@/features/routineTasks/hooks/useRoutineTaskMutations';

/**
 * Composer hook that combines all routine task-related hooks
 * 習慣化タスク一覧を管理するフック
 */
export const useRoutineTasks = () => {
  // データ取得
  const { routineTasks, loading, error, refreshRoutineTasks } =
    useFetchRoutineTasks();

  // CRUD操作
  const {
    createRoutineTask,
    updateRoutineTask,
    deleteRoutineTask,
    createLoading,
    updateLoading,
    deleteLoading,
    error: mutationError,
  } = useRoutineTaskMutations(refreshRoutineTasks);

  return {
    routineTasks,
    loading,
    createLoading,
    updateLoading,
    deleteLoading,
    error: error || mutationError,
    refreshRoutineTasks,
    createRoutineTask,
    updateRoutineTask,
    deleteRoutineTask,
  };
};
