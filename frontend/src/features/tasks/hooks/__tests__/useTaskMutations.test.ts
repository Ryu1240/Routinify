import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTaskMutations } from '../useTaskMutations';
import { tasksApi } from '../../api/tasksApi';

vi.mock('../../api/tasksApi');

describe('useTaskMutations', () => {
  const onRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createTask が API を呼び出し成功時に onRefresh を呼ぶこと', async () => {
    vi.mocked(tasksApi.create).mockResolvedValue(undefined);

    const { result } = renderHook(() => useTaskMutations(onRefresh));

    result.current.createTask({
      title: 'New Task',
      dueDate: null,
      status: null,
      priority: null,
      categoryId: null,
    });

    await waitFor(() => {
      expect(result.current.createLoading).toBe(false);
    });

    expect(tasksApi.create).toHaveBeenCalledWith({
      title: 'New Task',
      dueDate: null,
      status: null,
      priority: null,
      categoryId: null,
    });
    expect(onRefresh).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('createTask が失敗時に error を設定し err をスローすること', async () => {
    vi.mocked(tasksApi.create).mockRejectedValue(new Error('Create failed'));

    const { result } = renderHook(() => useTaskMutations(onRefresh));

    await expect(
      result.current.createTask({
        title: 'New',
        dueDate: null,
        status: null,
        priority: null,
        categoryId: null,
      })
    ).rejects.toThrow('Create failed');

    await waitFor(() => {
      expect(result.current.createLoading).toBe(false);
      expect(result.current.error).toBe(
        'タスクの作成に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('updateTask が API を呼び出し成功時に onRefresh を呼ぶこと', async () => {
    vi.mocked(tasksApi.update).mockResolvedValue(undefined);

    const { result } = renderHook(() => useTaskMutations(onRefresh));

    result.current.updateTask(1, {
      title: 'Updated Task',
      status: 'completed',
    });

    await waitFor(() => {
      expect(result.current.updateLoading).toBe(false);
    });

    expect(tasksApi.update).toHaveBeenCalledWith(1, {
      title: 'Updated Task',
      status: 'completed',
    });
    expect(onRefresh).toHaveBeenCalled();
  });

  it('updateTask が失敗時に error を設定し err をスローすること', async () => {
    vi.mocked(tasksApi.update).mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useTaskMutations(onRefresh));

    await expect(
      result.current.updateTask(1, { title: 'Updated' })
    ).rejects.toThrow('Update failed');

    await waitFor(() => {
      expect(result.current.updateLoading).toBe(false);
      expect(result.current.error).toBe(
        'タスクの更新に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('deleteTask が API を呼び出し成功時に onRefresh を呼ぶこと', async () => {
    vi.mocked(tasksApi.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => useTaskMutations(onRefresh));

    result.current.deleteTask(1);

    await waitFor(() => {
      expect(result.current.deleteLoading).toBe(false);
    });

    expect(tasksApi.delete).toHaveBeenCalledWith(1);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('deleteTask が失敗時に error を設定し err をスローすること', async () => {
    vi.mocked(tasksApi.delete).mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useTaskMutations(onRefresh));

    await expect(result.current.deleteTask(1)).rejects.toThrow('Delete failed');

    await waitFor(() => {
      expect(result.current.deleteLoading).toBe(false);
      expect(result.current.error).toBe(
        'タスクの削除に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });
});
