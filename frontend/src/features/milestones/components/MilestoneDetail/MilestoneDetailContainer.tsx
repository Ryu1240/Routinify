import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert } from '@mantine/core';
import { useAuth } from '@/shared/hooks/useAuth';
import { ListPageState } from '@/shared/components';
import { handleApiError } from '@/shared/utils/apiErrorUtils';
import { useFetchMilestone } from '../../hooks/useFetchMilestone';
import { useMilestoneMutations } from '../../hooks/useMilestoneMutations';
import { UpdateMilestoneDto } from '@/types/milestone';
import { UpdateTaskDto } from '@/types/task';
import { MilestoneDetail } from './MilestoneDetail';
import { DeleteMilestoneConfirmModal } from '@/features/milestones/components/DeleteMilestoneConfirmModal';
import { AssociateTaskModal } from './AssociateTaskModal';
import { tasksApi } from '@/features/tasks/api/tasksApi';

export const MilestoneDetailContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const milestoneId = id ? parseInt(id, 10) : null;
  const { milestone, loading, error, refreshMilestone } =
    useFetchMilestone(milestoneId);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssociateTaskModalOpen, setIsAssociateTaskModalOpen] =
    useState(false);
  const {
    updateMilestone,
    updateLoading,
    deleteMilestone,
    deleteLoading,
    associateTask,
    associateLoading,
    dissociateTask,
    dissociateLoading,
  } = useMilestoneMutations(() => {
    if (milestoneId) {
      refreshMilestone();
    }
  });
  const handleEdit = async (milestoneData: UpdateMilestoneDto) => {
    if (!milestoneId) return;
    await updateMilestone(milestoneId, milestoneData);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!milestoneId) return;
    await deleteMilestone(milestoneId);
    setIsDeleteModalOpen(false);
    // 削除後は一覧ページにリダイレクト
    navigate('/milestones');
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
  };

  const handleDissociateTask = async (taskIds: number[]) => {
    if (!milestoneId) return;
    try {
      await dissociateTask(milestoneId, taskIds);
    } catch (error) {
      handleApiError(error, {
        defaultMessage:
          'タスクの関連付け解除に失敗しました。しばらく時間をおいて再度お試しください。',
      });
    }
  };

  const handleAddTask = () => {
    setIsAssociateTaskModalOpen(true);
  };

  const handleAssociateTask = async (taskIds: number[]) => {
    if (!milestoneId) return;
    try {
      await associateTask(milestoneId, taskIds);
    } catch (error) {
      handleApiError(error, {
        defaultMessage:
          'タスクの関連付けに失敗しました。しばらく時間をおいて再度お試しください。',
      });
      throw error;
    }
  };

  const handleEditTask = async (taskId: number, taskData: UpdateTaskDto) => {
    try {
      await tasksApi.update(taskId, taskData);
      if (milestoneId) {
        refreshMilestone();
      }
      window.dispatchEvent(
        new CustomEvent('tasks-refresh', { detail: { silent: true } })
      );
    } catch (error) {
      handleApiError(error, {
        defaultMessage:
          'タスクの更新に失敗しました。しばらく時間をおいて再度お試しください。',
      });
      throw error;
    }
  };

  if (authLoading || loading) {
    return (
      <ListPageState
        variant="loading"
        loadingMessage={
          authLoading ? '認証情報を確認中...' : 'マイルストーンを読み込み中...'
        }
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <ListPageState
        variant="unauthenticated"
        unauthenticatedMessage="マイルストーン詳細を表示するにはログインが必要です。"
      />
    );
  }

  if (error) {
    return (
      <ListPageState
        variant="error"
        errorMessage={error}
        onRetry={refreshMilestone}
      />
    );
  }

  if (!milestone) {
    return (
      <Alert title="マイルストーンが見つかりません" color="red" variant="light">
        指定されたマイルストーンは存在しないか、アクセス権限がありません。
      </Alert>
    );
  }

  return (
    <>
      <MilestoneDetail
        milestone={milestone}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDissociateTask={handleDissociateTask}
        onAddTask={handleAddTask}
        onEditTask={handleEditTask}
        editLoading={updateLoading}
        dissociateLoading={dissociateLoading}
      />
      <DeleteMilestoneConfirmModal
        opened={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteConfirm}
        milestoneName={milestone.name}
        loading={deleteLoading}
      />
      <AssociateTaskModal
        opened={isAssociateTaskModalOpen}
        onClose={() => setIsAssociateTaskModalOpen(false)}
        onAssociate={handleAssociateTask}
        loading={associateLoading}
        associatedTaskIds={milestone?.tasks?.map((t) => t.id) || []}
      />
    </>
  );
};
