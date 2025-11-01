import { useState } from 'react';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  Milestone,
} from '@/types/milestone';
import { milestonesApi } from '../api/milestonesApi';

export const useMilestoneMutations = (onRefresh: () => void) => {
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [associateLoading, setAssociateLoading] = useState(false);
  const [dissociateLoading, setDissociateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMilestone = async (milestoneData: CreateMilestoneDto) => {
    try {
      setCreateLoading(true);
      setError(null);

      await milestonesApi.create(milestoneData);

      // 作成後にマイルストーンリストを再取得
      onRefresh();
    } catch (err) {
      console.error('マイルストーンの作成に失敗しました:', err);
      setError(
        'マイルストーンの作成に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setCreateLoading(false);
    }
  };

  const updateMilestone = async (
    id: number,
    milestoneData: UpdateMilestoneDto
  ) => {
    try {
      setUpdateLoading(true);
      setError(null);

      await milestonesApi.update(id, milestoneData);

      // 更新後にマイルストーンリストを再取得
      onRefresh();
    } catch (err) {
      console.error('マイルストーンの更新に失敗しました:', err);
      setError(
        'マイルストーンの更新に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteMilestone = async (id: number) => {
    try {
      setDeleteLoading(true);
      setError(null);

      await milestonesApi.delete(id);

      // 削除後にマイルストーンリストを再取得
      onRefresh();
    } catch (err) {
      console.error('マイルストーンの削除に失敗しました:', err);
      setError(
        'マイルストーンの削除に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setDeleteLoading(false);
    }
  };

  const associateTask = async (
    milestoneId: number,
    taskIds: number[]
  ): Promise<Milestone> => {
    try {
      setAssociateLoading(true);
      setError(null);

      const updatedMilestone = await milestonesApi.associateTask(
        milestoneId,
        taskIds
      );

      // 更新後にマイルストーンリストを再取得
      onRefresh();

      return updatedMilestone;
    } catch (err) {
      console.error('タスクの関連付けに失敗しました:', err);
      setError(
        'タスクの関連付けに失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setAssociateLoading(false);
    }
  };

  const dissociateTask = async (
    milestoneId: number,
    taskIds: number[]
  ): Promise<Milestone> => {
    try {
      setDissociateLoading(true);
      setError(null);

      const updatedMilestone = await milestonesApi.dissociateTask(
        milestoneId,
        taskIds
      );

      // 更新後にマイルストーンリストを再取得
      onRefresh();

      return updatedMilestone;
    } catch (err) {
      console.error('タスクの関連付け解除に失敗しました:', err);
      setError(
        'タスクの関連付け解除に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setDissociateLoading(false);
    }
  };

  return {
    createMilestone,
    createLoading,
    updateMilestone,
    updateLoading,
    deleteMilestone,
    deleteLoading,
    associateTask,
    associateLoading,
    dissociateTask,
    dissociateLoading,
    error,
  };
};
