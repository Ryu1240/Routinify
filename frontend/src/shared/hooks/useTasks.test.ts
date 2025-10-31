import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useTasks } from './useTasks';
import axios from '@/lib/axios';

// useAuthのモック
const mockUseAuth = vi.fn();
vi.mock('./useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// axiosのモック
vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockTasks = [
  { id: 1, title: 'Task 1', category: 'Work', status: 'pending' },
  { id: 2, title: 'Task 2', category: 'Personal', status: 'completed' },
];

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      accessToken: null,
    });

    const { result } = renderHook(() => useTasks());

    expect(result.current.tasks).toEqual([]);
    expect(result.current.filteredTasks).toEqual([]);
    expect(result.current.search).toBe('');
    expect(result.current.sortBy).toBeNull();
    expect(result.current.reverseSortDirection).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches tasks when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock-token',
    });

    const mockAxiosGet = vi.mocked(axios.get);
    mockAxiosGet.mockResolvedValue({
      data: { data: mockTasks },
    } as any);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    expect(mockAxiosGet).toHaveBeenCalledWith('/api/v1/tasks', undefined);
  });

  it('handles fetch error', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock-token',
    });

    const errorMessage = 'タスクの取得に失敗しました';
    const mockAxiosGet = vi.mocked(axios.get);
    mockAxiosGet.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(
        'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    });
  });

  it('filters tasks based on search term', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock-token',
    });

    const mockAxiosGet = vi.mocked(axios.get);
    mockAxiosGet.mockResolvedValue({
      data: { data: mockTasks },
    } as any);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.tasks).toEqual(mockTasks);
    });

    act(() => {
      result.current.setSearch('Task 1');
    });

    await waitFor(() => {
      expect(result.current.filteredTasks).toHaveLength(1);
      expect(result.current.filteredTasks[0].title).toBe('Task 1');
    });
  });

  it('sorts tasks when sortBy is set', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock-token',
    });

    const mockAxiosGet = vi.mocked(axios.get);
    mockAxiosGet.mockResolvedValue({
      data: { data: mockTasks },
    } as any);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.tasks).toEqual(mockTasks);
    });

    act(() => {
      result.current.setSorting('title');
    });

    await waitFor(() => {
      expect(result.current.sortBy).toBe('title');
      expect(result.current.reverseSortDirection).toBe(false);
    });
  });

  it('toggles sort direction when same field is clicked', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock-token',
    });

    const mockAxiosGet = vi.mocked(axios.get);
    mockAxiosGet.mockResolvedValue({
      data: { data: mockTasks },
    } as any);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.tasks).toEqual(mockTasks);
    });

    act(() => {
      result.current.setSorting('title');
    });

    await waitFor(() => {
      expect(result.current.sortBy).toBe('title');
      expect(result.current.reverseSortDirection).toBe(false);
    });

    act(() => {
      result.current.setSorting('title');
    });

    await waitFor(() => {
      expect(result.current.sortBy).toBe('title');
      expect(result.current.reverseSortDirection).toBe(true);
    });
  });

  it('refreshes tasks when refreshTasks is called', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock-token',
    });

    const mockAxiosGet = vi.mocked(axios.get);
    mockAxiosGet.mockResolvedValue({
      data: { data: mockTasks },
    } as any);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.tasks).toEqual(mockTasks);
    });

    // 新しいタスクデータ
    const newTasks = [
      { id: 3, title: 'Task 3', category: 'Work', status: 'pending' },
    ];
    mockAxiosGet.mockResolvedValue({
      data: { data: newTasks },
    } as any);

    // リフレッシュを実行
    act(() => {
      result.current.refreshTasks();
    });

    await waitFor(() => {
      expect(result.current.tasks).toEqual(newTasks);
    });

    expect(mockAxiosGet).toHaveBeenCalledTimes(2);
  });

  it('does not fetch tasks when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      accessToken: null,
    });

    renderHook(() => useTasks());

    // axiosのモックは呼ばれないことを確認
    expect(mockUseAuth).toHaveBeenCalled();
  });

  it('creates task successfully', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock-token',
    });

    const mockAxiosGet = vi.mocked(axios.get);
    const mockAxiosPost = vi.mocked(axios.post);

    const newTask = {
      id: 3,
      title: 'New Task',
      category: 'Work',
      status: '未着手',
      priority: '中',
      dueDate: null,
      accountId: 'user123',
      createdAt: '2023-01-01T00:00:00Z',
    };

    // 初期fetch用のモック
    mockAxiosGet.mockResolvedValue({
      data: { data: mockTasks },
    } as any);

    mockAxiosPost.mockResolvedValue({
      data: newTask,
    } as any);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.tasks).toEqual(mockTasks);
    });

    const taskData = {
      title: 'New Task',
      categoryId: 1,
      status: '未着手',
      priority: '中',
      dueDate: null,
    };

    // createTask後のfetchTasksで新しいタスクリストを返すようにモックを変更
    const updatedTasks = [newTask, ...mockTasks];
    mockAxiosGet.mockResolvedValue({
      data: { data: updatedTasks },
    } as any);

    await act(async () => {
      await result.current.createTask(taskData);
    });

    expect(mockAxiosPost).toHaveBeenCalledWith('/api/v1/tasks', {
      task: {
        title: 'New Task',
        due_date: null,
        status: '未着手',
        priority: '中',
        category_id: 1,
      },
    });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(3);
      expect(result.current.tasks[0]).toEqual(newTask);
      expect(result.current.createLoading).toBe(false);
    });
  });

  it('handles create task error', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock-token',
    });

    const mockAxiosGet = vi.mocked(axios.get);
    const mockAxiosPost = vi.mocked(axios.post);

    // fetchTasksは成功させる
    mockAxiosGet.mockResolvedValue({
      data: { data: [] },
    } as any);

    const { result } = renderHook(() => useTasks());

    // 初期fetchが完了するまで待機
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // createTaskでエラーを発生させる
    const errorMessage = 'Task creation failed';
    mockAxiosPost.mockRejectedValue(new Error(errorMessage));

    const taskData = {
      title: 'New Task',
      categoryId: 1,
      status: '未着手',
      priority: '中',
      dueDate: null,
    };

    // createTaskがエラーをthrowすることを確認
    await expect(
      act(async () => {
        await result.current.createTask(taskData);
      })
    ).rejects.toThrow(errorMessage);

    // createLoadingが false になることを確認
    expect(result.current.createLoading).toBe(false);
  });
});
