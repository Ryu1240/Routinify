import React from 'react';
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
    loading: tasksLoading,
    error: tasksError,
    refreshTasks,
    toggleTaskStatus,
    setTaskStatusToCompleted,
    setTaskStatusToPending,
  } = useDashboardTasks();

  const loading = routineTasksLoading || tasksLoading;
  const error = routineTasksError || tasksError;

  const handleRetry = () => {
    refetchRoutineTasks();
    refreshTasks();
  };

  return (
    <Dashboard
      routineTasks={routineTasks}
      tasks={tasks}
      loading={loading}
      error={error}
      onRetry={handleRetry}
      onToggleTaskStatus={toggleTaskStatus}
      onSetTaskStatusToCompleted={setTaskStatusToCompleted}
      onSetTaskStatusToPending={setTaskStatusToPending}
    />
  );
};
