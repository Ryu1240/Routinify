import React, { useEffect, useState } from 'react';
import { useDashboard, useDashboardTasks } from '../../hooks';
import { Dashboard } from './Dashboard';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import { useCategories } from '@/shared/hooks/useCategories';
import { CreateTaskDto } from '@/types';
import { handleApiError } from '@/shared/utils/apiErrorUtils';
import { tasksApi } from '@/features/tasks/api/tasksApi';

export const DashboardContainer: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
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
  const {
    categories,
    createCategory,
    createLoading: createCategoryLoading,
  } = useCategories();

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

  const handleAddTask = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateTask = async (taskData: CreateTaskDto) => {
    try {
      setCreateLoading(true);
      await tasksApi.create(taskData);
      setIsCreateModalOpen(false);
      window.dispatchEvent(
        new CustomEvent('tasks-refresh', { detail: { silent: true } })
      );
    } catch (error) {
      handleApiError(error, {
        defaultMessage:
          'タスクの作成に失敗しました。しばらく時間をおいて再度お試しください。',
      });
      throw error;
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <>
      <Dashboard
        routineTasks={routineTasks}
        tasks={tasks}
        milestones={milestones}
        onAddTask={handleAddTask}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        onToggleTaskStatus={toggleTaskStatus}
        onSetTaskStatusToCompleted={setTaskStatusToCompleted}
        onSetTaskStatusToPending={setTaskStatusToPending}
        onDeleteTask={handleDelete}
      />
      <CreateTaskModal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        loading={createLoading}
        categories={categories}
        onCreateCategory={createCategory}
        createCategoryLoading={createCategoryLoading}
      />
    </>
  );
};
