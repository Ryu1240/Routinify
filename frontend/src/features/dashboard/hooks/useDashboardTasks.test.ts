import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardTasks } from './useDashboardTasks';
import { tasksApi } from '@/features/tasks/api/tasksApi';
import { useAuth } from '@/shared/hooks/useAuth';
import { Task } from '@/types';

vi.mock('@/features/tasks/api/tasksApi');
vi.mock('@/shared/hooks/useAuth');

describe('useDashboardTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('新しいクエリパラメータでAPIを呼び出すこと', async () => {
    const mockTasks: Task[] = [
      {
        id: 1,
        accountId: 'user-1',
        title: 'Task 1',
        status: 'pending',
        priority: 'high',
        dueDate: '2024-01-15T00:00:00.000Z',
        categoryId: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        accountId: 'user-1',
        title: 'Task 2',
        status: 'in_progress',
        priority: 'medium',
        dueDate: '2024-01-16T00:00:00.000Z',
        categoryId: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      user: null,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(tasksApi.fetchAll).mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useDashboardTasks());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(tasksApi.fetchAll).toHaveBeenCalledWith({
      statuses: 'pending,in_progress',
      sort_by: 'due_date',
      sort_order: 'asc',
    });
    expect(result.current.tasks).toEqual(mockTasks);
    expect(result.current.error).toBeNull();
  });

  it('未完了・進行中のタスクのみが取得されること', async () => {
    const mockTasks: Task[] = [
      {
        id: 1,
        accountId: 'user-1',
        title: 'Task 1',
        status: 'pending',
        priority: 'high',
        dueDate: '2024-01-15T00:00:00.000Z',
        categoryId: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        accountId: 'user-1',
        title: 'Task 2',
        status: 'in_progress',
        priority: 'medium',
        dueDate: '2024-01-16T00:00:00.000Z',
        categoryId: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      user: null,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(tasksApi.fetchAll).mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useDashboardTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const statuses = result.current.tasks.map((task) => task.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('in_progress');
    expect(statuses).not.toContain('completed');
  });

  it('期限日が近い順にソートされていること', async () => {
    const mockTasks: Task[] = [
      {
        id: 1,
        accountId: 'user-1',
        title: 'Task 1',
        status: 'pending',
        priority: 'high',
        dueDate: '2024-01-16T00:00:00.000Z',
        categoryId: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        accountId: 'user-1',
        title: 'Task 2',
        status: 'in_progress',
        priority: 'medium',
        dueDate: '2024-01-15T00:00:00.000Z',
        categoryId: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      user: null,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(tasksApi.fetchAll).mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useDashboardTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // バックエンドでソートされるため、APIの呼び出しパラメータを確認
    expect(tasksApi.fetchAll).toHaveBeenCalledWith({
      statuses: 'pending,in_progress',
      sort_by: 'due_date',
      sort_order: 'asc',
    });
  });

  it('タスクが0件の場合の動作', async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      user: null,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(tasksApi.fetchAll).mockResolvedValue([]);

    const { result } = renderHook(() => useDashboardTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('エラーハンドリングが正しく動作すること', async () => {
    const mockError = new Error('Network error');

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      user: null,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(tasksApi.fetchAll).mockRejectedValue(mockError);

    const { result } = renderHook(() => useDashboardTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.tasks).toHaveLength(0);
  });

  it('認証されていない場合、タスクを取得しないこと', async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      hasAccessToken: false,
      user: null,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useDashboardTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(tasksApi.fetchAll).not.toHaveBeenCalled();
    expect(result.current.tasks).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('toggleTaskStatus, setTaskStatusToCompleted, setTaskStatusToPendingが返されること', async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      user: null,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(tasksApi.fetchAll).mockResolvedValue([]);

    const { result } = renderHook(() => useDashboardTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.toggleTaskStatus).toBeDefined();
    expect(result.current.setTaskStatusToCompleted).toBeDefined();
    expect(result.current.setTaskStatusToPending).toBeDefined();
    expect(typeof result.current.toggleTaskStatus).toBe('function');
    expect(typeof result.current.setTaskStatusToCompleted).toBe('function');
    expect(typeof result.current.setTaskStatusToPending).toBe('function');
  });

  it('toggleTaskStatusが正しく動作すること', async () => {
    const mockTasks: Task[] = [
      {
        id: 1,
        accountId: 'user-1',
        title: 'Task 1',
        status: 'pending',
        priority: 'high',
        dueDate: '2024-01-15T00:00:00.000Z',
        categoryId: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      user: null,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(tasksApi.fetchAll).mockResolvedValue(mockTasks);
    vi.mocked(tasksApi.update).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDashboardTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.toggleTaskStatus(1, 'pending');

    expect(tasksApi.update).toHaveBeenCalledWith(1, { status: 'in_progress' });
    expect(tasksApi.fetchAll).toHaveBeenCalledTimes(2); // 初期取得 + 更新後の再取得
  });

  it('setTaskStatusToCompletedが正しく動作すること', async () => {
    const mockTasks: Task[] = [
      {
        id: 1,
        accountId: 'user-1',
        title: 'Task 1',
        status: 'pending',
        priority: 'high',
        dueDate: '2024-01-15T00:00:00.000Z',
        categoryId: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      user: null,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(tasksApi.fetchAll).mockResolvedValue(mockTasks);
    vi.mocked(tasksApi.update).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDashboardTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.setTaskStatusToCompleted(1);

    expect(tasksApi.update).toHaveBeenCalledWith(1, { status: 'completed' });
    expect(tasksApi.fetchAll).toHaveBeenCalledTimes(2); // 初期取得 + 更新後の再取得
  });

  it('setTaskStatusToPendingが正しく動作すること', async () => {
    const mockTasks: Task[] = [
      {
        id: 1,
        accountId: 'user-1',
        title: 'Task 1',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2024-01-15T00:00:00.000Z',
        categoryId: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      user: null,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(tasksApi.fetchAll).mockResolvedValue(mockTasks);
    vi.mocked(tasksApi.update).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDashboardTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.setTaskStatusToPending(1);

    expect(tasksApi.update).toHaveBeenCalledWith(1, { status: 'pending' });
    expect(tasksApi.fetchAll).toHaveBeenCalledTimes(2); // 初期取得 + 更新後の再取得
  });
});
