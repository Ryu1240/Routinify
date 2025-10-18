import React, { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { UpdateTaskDto, CreateTaskDto } from '@/types';
import { CreateCategoryDto } from '@/types/category';
import { TaskList } from './TaskList';
import CreateTaskModal from '@/components/tasks/CreateTaskModal/index';

export const TaskListContainer: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    filteredTasks,
    search,
    setSearch,
    sortBy,
    reverseSortDirection,
    loading,
    createLoading,
    error,
    setSorting,
    createTask,
    updateTask,
    deleteTask,
  } = useTasks();
  const {
    categories,
    loading: categoriesLoading,
    createCategory,
    createLoading: categoryCreateLoading,
  } = useCategories();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  const handleEdit = (taskId: number) => {
    setEditingTaskId(taskId);
  };

  const handleSave = async (taskId: number, taskData: UpdateTaskDto) => {
    try {
      await updateTask(taskId, taskData);
      setEditingTaskId(null);
    } catch (error) {
      console.error('タスク更新に失敗:', error);
    }
  };

  const handleCancel = () => {
    setEditingTaskId(null);
  };

  const handleDelete = async (taskId: number) => {
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('タスク削除に失敗:', error);
      }
    }
  };

  const handleAddTask = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateTask = async (taskData: CreateTaskDto) => {
    try {
      await createTask(taskData);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('タスク作成に失敗:', error);
    }
  };

  const handleCreateCategory = async (categoryData: CreateCategoryDto) => {
    await createCategory(categoryData);
  };

  return (
    <>
      <TaskList
        isAuthenticated={isAuthenticated}
        authLoading={authLoading || categoriesLoading}
        tasks={filteredTasks}
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        reverseSortDirection={reverseSortDirection}
        onSort={(key) => setSorting(key as any)}
        loading={loading}
        error={error}
        editingTaskId={editingTaskId}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={handleDelete}
        onAddTask={handleAddTask}
        categories={categories}
        onCreateCategory={handleCreateCategory}
        createCategoryLoading={categoryCreateLoading}
      />

      <CreateTaskModal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        loading={createLoading}
        categories={categories}
        onCreateCategory={handleCreateCategory}
        createCategoryLoading={categoryCreateLoading}
      />
    </>
  );
};
