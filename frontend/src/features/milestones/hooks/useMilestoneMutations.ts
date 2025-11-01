import { useState } from 'react';
import { CreateMilestoneDto, UpdateMilestoneDto } from '@/types/milestone';
import { milestonesApi } from '../api/milestonesApi';

export const useMilestoneMutations = (onRefresh: () => void) => {
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
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

  return {
    createMilestone,
    createLoading,
    updateMilestone,
    updateLoading,
    error,
  };
};
