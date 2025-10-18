import { useFetchTasks } from '@/features/tasks/hooks/useFetchTasks';
import { useTaskFilters } from '@/features/tasks/hooks/useTaskFilters';
import { useTaskSort } from '@/features/tasks/hooks/useTaskSort';
import { useTaskMutations } from '@/features/tasks/hooks/useTaskMutations';

/**
 * Composer hook that combines all task-related hooks
 * フィルタとソートを組み合わせてタスク一覧を管理するフック
 */
export const useTasks = () => {
  // データ取得
  const { tasks, loading, error, refreshTasks } = useFetchTasks();

  // フィルタリング
  const { search, setSearch, filteredTasks } = useTaskFilters(tasks);

  // ソート
  const { sortBy, reverseSortDirection, sortedTasks, setSorting } =
    useTaskSort(filteredTasks);

  // CRUD操作
  const {
    createTask,
    updateTask,
    deleteTask,
    createLoading,
    updateLoading,
    error: mutationError,
  } = useTaskMutations(refreshTasks);

  return {
    tasks,
    filteredTasks: sortedTasks,
    search,
    setSearch,
    sortBy,
    reverseSortDirection,
    loading,
    createLoading,
    updateLoading,
    error: error || mutationError,
    setSorting,
    refreshTasks,
    createTask,
    updateTask,
    deleteTask,
  };
};
