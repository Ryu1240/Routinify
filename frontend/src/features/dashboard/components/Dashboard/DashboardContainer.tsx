import React from 'react';
import { useDashboard, useDashboardTasks } from '../../hooks';
import { Dashboard } from './Dashboard';

export const DashboardContainer: React.FC = () => {
  const {
    routineTasks,
    loading: routineTasksLoading,
    error: routineTasksError,
  } = useDashboard();

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    toggleTaskStatus,
    setTaskStatusToCompleted,
    setTaskStatusToPending,
  } = useDashboardTasks();

  const loading = routineTasksLoading || tasksLoading;
  const error = routineTasksError || tasksError;

  return (
    <Dashboard
      routineTasks={routineTasks}
      tasks={tasks}
      loading={loading}
      error={error}
      onToggleTaskStatus={toggleTaskStatus}
      onSetTaskStatusToCompleted={setTaskStatusToCompleted}
      onSetTaskStatusToPending={setTaskStatusToPending}
    />
  );
};
