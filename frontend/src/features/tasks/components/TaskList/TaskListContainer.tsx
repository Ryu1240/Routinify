import React, { useState, useMemo } from 'react';
import { useTasks } from '@/shared/hooks/useTasks';
import { useCategories } from '@/shared/hooks/useCategories';
import { useAuth } from '@/shared/hooks/useAuth';
import { useFetchMilestones } from '@/features/milestones/hooks/useFetchMilestones';
import { useMilestoneMutations } from '@/features/milestones/hooks/useMilestoneMutations';
import { UpdateTaskDto, CreateTaskDto, Task } from '@/types';
import { CreateCategoryDto } from '@/types/category';
import { TaskList } from './TaskList';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import { TaskMilestoneModal } from '@/features/tasks/components/TaskMilestoneModal';

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

  const { milestones, loading: milestonesLoading, refreshMilestones } = useFetchMilestones();
  const { associateTask, dissociateTask, associateLoading, dissociateLoading } = useMilestoneMutations(() => {
    refreshMilestones();
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingTaskIdForMilestone, setEditingTaskIdForMilestone] = useState<number | null>(null);
  const [milestoneChangeLoading, setMilestoneChangeLoading] = useState(false);

  // タスクとマイルストーンの紐付けマップを作成（複数マイルストーン対応）
  const taskMilestoneMap = useMemo(() => {
    const map = new Map<number, number[]>();
    milestones.forEach((milestone) => {
      if (milestone.tasks) {
        milestone.tasks.forEach((task) => {
          const currentIds = map.get(task.id) || [];
          if (!currentIds.includes(milestone.id)) {
            map.set(task.id, [...currentIds, milestone.id]);
          }
        });
      }
    });
    return map;
  }, [milestones]);

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

  const handleOpenMilestoneModal = (taskId: number) => {
    setEditingTaskIdForMilestone(taskId);
    setIsMilestoneModalOpen(true);
  };

  const handleCloseMilestoneModal = () => {
    setIsMilestoneModalOpen(false);
    setEditingTaskIdForMilestone(null);
  };

  const handleAssociateMilestones = async (milestoneIds: number[]) => {
    if (editingTaskIdForMilestone === null) return;
    try {
      setMilestoneChangeLoading(true);
      // 各マイルストーンにタスクを紐付け
      for (const milestoneId of milestoneIds) {
        await associateTask(milestoneId, [editingTaskIdForMilestone]);
      }
      await refreshMilestones();
    } catch (error) {
      console.error('マイルストーンの紐付けに失敗:', error);
      throw error;
    } finally {
      setMilestoneChangeLoading(false);
    }
  };

  const handleDissociateMilestones = async (milestoneIds: number[]) => {
    if (editingTaskIdForMilestone === null) return;
    try {
      setMilestoneChangeLoading(true);
      // 各マイルストーンからタスクを解除
      for (const milestoneId of milestoneIds) {
        await dissociateTask(milestoneId, [editingTaskIdForMilestone]);
      }
      await refreshMilestones();
    } catch (error) {
      console.error('マイルストーンの解除に失敗:', error);
      throw error;
    } finally {
      setMilestoneChangeLoading(false);
    }
  };


  return (
    <>
      <TaskList
        isAuthenticated={isAuthenticated}
        authLoading={authLoading || categoriesLoading || milestonesLoading}
        tasks={filteredTasks}
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        reverseSortDirection={reverseSortDirection}
        onSort={(key) => setSorting(key as keyof Task)}
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
        milestones={milestones}
        taskMilestoneMap={taskMilestoneMap}
        onOpenMilestoneModal={handleOpenMilestoneModal}
      />

      {editingTaskIdForMilestone !== null && (
        <TaskMilestoneModal
          opened={isMilestoneModalOpen}
          onClose={handleCloseMilestoneModal}
          onAssociate={handleAssociateMilestones}
          onDissociate={handleDissociateMilestones}
          loading={milestoneChangeLoading || associateLoading || dissociateLoading}
          currentMilestoneIds={taskMilestoneMap.get(editingTaskIdForMilestone) || []}
          milestones={milestones}
        />
      )}

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
