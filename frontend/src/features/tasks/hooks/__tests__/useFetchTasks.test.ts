import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFetchTasks } from '../useFetchTasks';
import { useAuth } from '@/shared/hooks/useAuth';
import { tasksApi } from '../../api/tasksApi';
import type { Task } from '@/types';

vi.mock('@/shared/hooks/useAuth');
vi.mock('../../api/tasksApi');

const mockTasks: Task[] = [
  {
    id: 1,
    accountId: 'acc-1',
    title: 'Task 1',
    dueDate: null,
    status: 'pending',
    priority: 'medium',
    categoryId: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

describe('useFetchTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      user: null,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('認証済みの場合 tasksApi.fetchAll を呼び出しタスク一覧を返すこと', async () => {
    vi.mocked(tasksApi.fetchAll).mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useFetchTasks());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(tasksApi.fetchAll).toHaveBeenCalledWith(
      { include_completed: false },
      false
    );
    expect(result.current.tasks).toEqual(mockTasks);
    expect(result.current.error).toBeNull();
  });

  it('認証されていない場合 fetch を呼ばず loading を false にすること', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      hasAccessToken: false,
      user: null,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useFetchTasks());

    expect(result.current.loading).toBe(false);
    expect(result.current.tasks).toEqual([]);
    expect(tasksApi.fetchAll).not.toHaveBeenCalled();
  });

  it('取得に失敗した場合 error を設定すること', async () => {
    vi.mocked(tasksApi.fetchAll).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFetchTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(
      'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。'
    );
    expect(result.current.tasks).toEqual([]);
  });

  it('refreshTasks を呼ぶと skipCache true で再取得すること', async () => {
    vi.mocked(tasksApi.fetchAll).mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useFetchTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newTasks = [
      ...mockTasks,
      {
        id: 2,
        accountId: 'acc-1',
        title: 'Task 2',
        dueDate: null,
        status: 'pending',
        priority: 'low',
        categoryId: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ] as Task[];
    vi.mocked(tasksApi.fetchAll).mockResolvedValue(newTasks);

    result.current.refreshTasks();

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(2);
    });

    expect(tasksApi.fetchAll).toHaveBeenLastCalledWith(
      { include_completed: false },
      true
    );
  });

  it('tasks-refresh イベント（silent: true）で静かに再取得すること', async () => {
    vi.mocked(tasksApi.fetchAll).mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useFetchTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newTasks = [{ ...mockTasks[0], id: 99 }] as Task[];
    vi.mocked(tasksApi.fetchAll).mockResolvedValue(newTasks);

    window.dispatchEvent(
      new CustomEvent('tasks-refresh', { detail: { silent: true } })
    );

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toBe(99);
    });

    expect(tasksApi.fetchAll).toHaveBeenLastCalledWith(
      { include_completed: false },
      true
    );
  });

  it('tasks-refresh イベント（silent なし）で refreshTasks が呼ばれること', async () => {
    vi.mocked(tasksApi.fetchAll).mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useFetchTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.mocked(tasksApi.fetchAll).mockResolvedValue([]);

    window.dispatchEvent(new CustomEvent('tasks-refresh'));

    await waitFor(() => {
      expect(tasksApi.fetchAll).toHaveBeenLastCalledWith(
        { include_completed: false },
        true
      );
    });
  });

  it('includeCompleted オプションを渡した場合、その値で fetchAll を呼び出すこと', async () => {
    vi.mocked(tasksApi.fetchAll).mockResolvedValue(mockTasks);

    renderHook(() => useFetchTasks({ includeCompleted: true }));

    await waitFor(() => {
      expect(tasksApi.fetchAll).toHaveBeenCalledWith(
        { include_completed: true },
        false
      );
    });
  });
});
