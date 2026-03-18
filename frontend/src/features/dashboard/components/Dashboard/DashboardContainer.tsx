import React, { useEffect } from 'react';
import { useDashboard, useDashboardTasks } from '../../hooks';
import { Dashboard } from './Dashboard';

export const DashboardContainer: React.FC = () => {
  const {
    routineTasks,
    loading: routineTasksLoading,
    error: routineTasksError,
    refetchRoutineTasks,
  } = useDashboard();

  const {
    tasks,
    milestones,
    loading: tasksLoading,
    error: tasksError,
    refreshTasks,
    toggleTaskStatus,
    setTaskStatusToCompleted,
    setTaskStatusToPending,
    deleteTask,
  } = useDashboardTasks();

  const loading = routineTasksLoading || tasksLoading;
  const error = routineTasksError || tasksError;

  useEffect(() => {
    const handleTasksRefresh = () => {
      // ローディングは出さず、既存表示データを差し替えるだけ
      refetchRoutineTasks(true);
      refreshTasks(true);
    };

    window.addEventListener('tasks-refresh', handleTasksRefresh);

    return () => {
      window.removeEventListener('tasks-refresh', handleTasksRefresh);
    };
  }, [refetchRoutineTasks, refreshTasks]);

  const handleRetry = () => {
    refetchRoutineTasks();
    refreshTasks();
  };

  const handleDelete = async (taskId: number) => {
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
      try {
        await deleteTask(taskId);
      } catch {
        // handleApiError でエラー表示済み
      }
    }
  };

  return (
    <Dashboard
      routineTasks={routineTasks}
      tasks={tasks}
      milestones={milestones}
      loading={loading}
      error={error}
      onRetry={handleRetry}
      onToggleTaskStatus={toggleTaskStatus}
      onSetTaskStatusToCompleted={setTaskStatusToCompleted}
      onSetTaskStatusToPending={setTaskStatusToPending}
      onDeleteTask={handleDelete}
    />
  );
};
