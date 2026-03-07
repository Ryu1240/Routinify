import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMilestoneMutations } from '../useMilestoneMutations';
import { milestonesApi } from '../../api/milestonesApi';
import type { Milestone } from '@/types/milestone';

vi.mock('../../api/milestonesApi');

const mockMilestone: Milestone = {
  id: 1,
  accountId: 'acc-1',
  name: 'Milestone 1',
  description: null,
  startDate: null,
  dueDate: null,
  status: 'planning',
  completedAt: null,
  progressPercentage: 0,
  totalTasksCount: 0,
  completedTasksCount: 0,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('useMilestoneMutations', () => {
  const onRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createMilestone が API を呼び出し成功時に onRefresh を呼ぶこと', async () => {
    vi.mocked(milestonesApi.create).mockResolvedValue(undefined);

    const { result } = renderHook(() => useMilestoneMutations(onRefresh));

    result.current.createMilestone({
      name: 'New Milestone',
      status: 'planning',
    });

    await waitFor(() => {
      expect(result.current.createLoading).toBe(false);
    });

    expect(milestonesApi.create).toHaveBeenCalledWith({
      name: 'New Milestone',
      status: 'planning',
    });
    expect(onRefresh).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('createMilestone が失敗時に error を設定し err をスローすること', async () => {
    vi.mocked(milestonesApi.create).mockRejectedValue(
      new Error('Create failed')
    );

    const { result } = renderHook(() => useMilestoneMutations(onRefresh));

    await expect(
      result.current.createMilestone({ name: 'New' })
    ).rejects.toThrow('Create failed');

    await waitFor(() => {
      expect(result.current.createLoading).toBe(false);
      expect(result.current.error).toBe(
        'マイルストーンの作成に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('updateMilestone が API を呼び出し成功時に onRefresh を呼ぶこと', async () => {
    vi.mocked(milestonesApi.update).mockResolvedValue(mockMilestone);

    const { result } = renderHook(() => useMilestoneMutations(onRefresh));

    result.current.updateMilestone(1, {
      name: 'Updated Milestone',
      status: 'in_progress',
    });

    await waitFor(() => {
      expect(result.current.updateLoading).toBe(false);
    });

    expect(milestonesApi.update).toHaveBeenCalledWith(1, {
      name: 'Updated Milestone',
      status: 'in_progress',
    });
    expect(onRefresh).toHaveBeenCalled();
  });

  it('updateMilestone が失敗時に error を設定し err をスローすること', async () => {
    vi.mocked(milestonesApi.update).mockRejectedValue(
      new Error('Update failed')
    );

    const { result } = renderHook(() => useMilestoneMutations(onRefresh));

    await expect(
      result.current.updateMilestone(1, { name: 'Updated' })
    ).rejects.toThrow('Update failed');

    await waitFor(() => {
      expect(result.current.updateLoading).toBe(false);
      expect(result.current.error).toBe(
        'マイルストーンの更新に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('deleteMilestone が API を呼び出し成功時に onRefresh を呼ぶこと', async () => {
    vi.mocked(milestonesApi.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => useMilestoneMutations(onRefresh));

    result.current.deleteMilestone(1);

    await waitFor(() => {
      expect(result.current.deleteLoading).toBe(false);
    });

    expect(milestonesApi.delete).toHaveBeenCalledWith(1);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('deleteMilestone が失敗時に error を設定し err をスローすること', async () => {
    vi.mocked(milestonesApi.delete).mockRejectedValue(
      new Error('Delete failed')
    );

    const { result } = renderHook(() => useMilestoneMutations(onRefresh));

    await expect(result.current.deleteMilestone(1)).rejects.toThrow(
      'Delete failed'
    );

    await waitFor(() => {
      expect(result.current.deleteLoading).toBe(false);
      expect(result.current.error).toBe(
        'マイルストーンの削除に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('associateTask が API を呼び出し成功時に onRefresh を呼びマイルストーンを返すこと', async () => {
    vi.mocked(milestonesApi.associateTask).mockResolvedValue(mockMilestone);

    const { result } = renderHook(() => useMilestoneMutations(onRefresh));

    const returned = result.current.associateTask(1, [10, 20]);

    await waitFor(() => {
      expect(result.current.associateLoading).toBe(false);
    });

    await expect(returned).resolves.toEqual(mockMilestone);
    expect(milestonesApi.associateTask).toHaveBeenCalledWith(1, [10, 20]);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('associateTask が失敗時に error を設定し err をスローすること', async () => {
    vi.mocked(milestonesApi.associateTask).mockRejectedValue(
      new Error('Associate failed')
    );

    const { result } = renderHook(() => useMilestoneMutations(onRefresh));

    await expect(result.current.associateTask(1, [10])).rejects.toThrow(
      'Associate failed'
    );

    await waitFor(() => {
      expect(result.current.associateLoading).toBe(false);
      expect(result.current.error).toBe(
        'タスクの関連付けに失敗しました。しばらく時間をおいて再度お試しください。'
      );
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('dissociateTask が API を呼び出し成功時に onRefresh を呼びマイルストーンを返すこと', async () => {
    vi.mocked(milestonesApi.dissociateTask).mockResolvedValue(mockMilestone);

    const { result } = renderHook(() => useMilestoneMutations(onRefresh));

    const returned = result.current.dissociateTask(1, [10, 20]);

    await waitFor(() => {
      expect(result.current.dissociateLoading).toBe(false);
    });

    await expect(returned).resolves.toEqual(mockMilestone);
    expect(milestonesApi.dissociateTask).toHaveBeenCalledWith(1, [10, 20]);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('dissociateTask が失敗時に error を設定し err をスローすること', async () => {
    vi.mocked(milestonesApi.dissociateTask).mockRejectedValue(
      new Error('Dissociate failed')
    );

    const { result } = renderHook(() => useMilestoneMutations(onRefresh));

    await expect(result.current.dissociateTask(1, [10])).rejects.toThrow(
      'Dissociate failed'
    );

    await waitFor(() => {
      expect(result.current.dissociateLoading).toBe(false);
      expect(result.current.error).toBe(
        'タスクの関連付け解除に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });
});
