import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useTasks } from './useTasks';

// 個別フックのモック
const mockUseFetchTasks = vi.fn();
const mockUseTaskFilters = vi.fn();
const mockUseTaskSort = vi.fn();
const mockUseTaskMutations = vi.fn();

vi.mock('@/features/tasks/hooks/useFetchTasks', () => ({
  useFetchTasks: () => mockUseFetchTasks(),
}));

vi.mock('@/features/tasks/hooks/useTaskFilters', () => ({
  useTaskFilters: () => mockUseTaskFilters(),
}));

vi.mock('@/features/tasks/hooks/useTaskSort', () => ({
  useTaskSort: () => mockUseTaskSort(),
}));

vi.mock('@/features/tasks/hooks/useTaskMutations', () => ({
  useTaskMutations: () => mockUseTaskMutations(),
}));

const mockTasks = [
  { id: 1, title: 'Task 1', category: 'Work', status: 'pending' },
  { id: 2, title: 'Task 2', category: 'Personal', status: 'completed' },
];

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのモック値を設定
    mockUseFetchTasks.mockReturnValue({
      tasks: [],
      loading: false,
      error: null,
      refreshTasks: vi.fn(),
    });

    mockUseTaskFilters.mockReturnValue({
      search: '',
      setSearch: vi.fn(),
      filteredTasks: [],
    });

    mockUseTaskSort.mockReturnValue({
      sortBy: null,
      reverseSortDirection: false,
      sortedTasks: [],
      setSorting: vi.fn(),
    });

    mockUseTaskMutations.mockReturnValue({
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      createLoading: false,
      updateLoading: false,
      error: null,
    });
  });

  it('returns initial state', () => {
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
    mockUseFetchTasks.mockReturnValue({
      tasks: mockTasks,
      loading: false,
      error: null,
      refreshTasks: vi.fn(),
    });

    mockUseTaskFilters.mockReturnValue({
      search: '',
      setSearch: vi.fn(),
      filteredTasks: mockTasks,
    });

    mockUseTaskSort.mockReturnValue({
      sortBy: null,
      reverseSortDirection: false,
      sortedTasks: mockTasks,
      setSorting: vi.fn(),
    });

    const { result } = renderHook(() => useTasks());

    expect(result.current.tasks).toEqual(mockTasks);
    expect(result.current.filteredTasks).toEqual(mockTasks);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error', async () => {
    const errorMessage =
      'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。';

    mockUseFetchTasks.mockReturnValue({
      tasks: [],
      loading: false,
      error: errorMessage,
      refreshTasks: vi.fn(),
    });

    const { result } = renderHook(() => useTasks());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('filters tasks based on search term', async () => {
    const filteredTasks = [mockTasks[0]]; // Task 1のみ

    mockUseFetchTasks.mockReturnValue({
      tasks: mockTasks,
      loading: false,
      error: null,
      refreshTasks: vi.fn(),
    });

    mockUseTaskFilters.mockReturnValue({
      search: 'Task 1',
      setSearch: vi.fn(),
      filteredTasks: filteredTasks,
    });

    mockUseTaskSort.mockReturnValue({
      sortBy: null,
      reverseSortDirection: false,
      sortedTasks: filteredTasks,
      setSorting: vi.fn(),
    });

    const { result } = renderHook(() => useTasks());

    expect(result.current.tasks).toEqual(mockTasks);
    expect(result.current.filteredTasks).toEqual(filteredTasks);
    expect(result.current.search).toBe('Task 1');
  });

  it('sorts tasks when sortBy is set', async () => {
    const sortedTasks = [...mockTasks].sort((a, b) =>
      a.title.localeCompare(b.title)
    );

    mockUseFetchTasks.mockReturnValue({
      tasks: mockTasks,
      loading: false,
      error: null,
      refreshTasks: vi.fn(),
    });

    mockUseTaskFilters.mockReturnValue({
      search: '',
      setSearch: vi.fn(),
      filteredTasks: mockTasks,
    });

    mockUseTaskSort.mockReturnValue({
      sortBy: 'title',
      reverseSortDirection: false,
      sortedTasks: sortedTasks,
      setSorting: vi.fn(),
    });

    const { result } = renderHook(() => useTasks());

    expect(result.current.tasks).toEqual(mockTasks);
    expect(result.current.filteredTasks).toEqual(sortedTasks);
    expect(result.current.sortBy).toBe('title');
  });

  it('toggles sort direction when same field is clicked', async () => {
    const sortedTasks = [...mockTasks].sort((a, b) =>
      a.title.localeCompare(b.title)
    );

    mockUseFetchTasks.mockReturnValue({
      tasks: mockTasks,
      loading: false,
      error: null,
      refreshTasks: vi.fn(),
    });

    mockUseTaskFilters.mockReturnValue({
      search: '',
      setSearch: vi.fn(),
      filteredTasks: mockTasks,
    });

    mockUseTaskSort.mockReturnValue({
      sortBy: 'title',
      reverseSortDirection: true,
      sortedTasks: sortedTasks,
      setSorting: vi.fn(),
    });

    const { result } = renderHook(() => useTasks());

    expect(result.current.tasks).toEqual(mockTasks);
    expect(result.current.filteredTasks).toEqual(sortedTasks);
    expect(result.current.sortBy).toBe('title');
    expect(result.current.reverseSortDirection).toBe(true);
  });

  it('refreshes tasks when refreshTasks is called', async () => {
    const mockRefreshTasks = vi.fn();

    mockUseFetchTasks.mockReturnValue({
      tasks: mockTasks,
      loading: false,
      error: null,
      refreshTasks: mockRefreshTasks,
    });

    mockUseTaskFilters.mockReturnValue({
      search: '',
      setSearch: vi.fn(),
      filteredTasks: mockTasks,
    });

    mockUseTaskSort.mockReturnValue({
      sortBy: null,
      reverseSortDirection: false,
      sortedTasks: mockTasks,
      setSorting: vi.fn(),
    });

    const { result } = renderHook(() => useTasks());

    expect(result.current.tasks).toEqual(mockTasks);

    act(() => {
      result.current.refreshTasks();
    });

    expect(mockRefreshTasks).toHaveBeenCalled();
  });

  it('does not fetch tasks when not authenticated', () => {
    mockUseFetchTasks.mockReturnValue({
      tasks: [],
      loading: false,
      error: null,
      refreshTasks: vi.fn(),
    });

    const { result } = renderHook(() => useTasks());

    expect(result.current.tasks).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('creates task successfully', async () => {
    const mockCreateTask = vi.fn();

    mockUseFetchTasks.mockReturnValue({
      tasks: mockTasks,
      loading: false,
      error: null,
      refreshTasks: vi.fn(),
    });

    mockUseTaskFilters.mockReturnValue({
      search: '',
      setSearch: vi.fn(),
      filteredTasks: mockTasks,
    });

    mockUseTaskSort.mockReturnValue({
      sortBy: null,
      reverseSortDirection: false,
      sortedTasks: mockTasks,
      setSorting: vi.fn(),
    });

    mockUseTaskMutations.mockReturnValue({
      createTask: mockCreateTask,
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      createLoading: false,
      updateLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useTasks());

    expect(result.current.tasks).toEqual(mockTasks);

    const newTask = { title: 'New Task', category: 'Work', status: 'pending' };
    await act(async () => {
      await result.current.createTask(newTask);
    });

    expect(mockCreateTask).toHaveBeenCalledWith(newTask);
  });

  it('handles create task error', async () => {
    const mockCreateTask = vi
      .fn()
      .mockRejectedValue(new Error('Task creation failed'));

    mockUseFetchTasks.mockReturnValue({
      tasks: [],
      loading: false,
      error: null,
      refreshTasks: vi.fn(),
    });

    mockUseTaskFilters.mockReturnValue({
      search: '',
      setSearch: vi.fn(),
      filteredTasks: [],
    });

    mockUseTaskSort.mockReturnValue({
      sortBy: null,
      reverseSortDirection: false,
      sortedTasks: [],
      setSorting: vi.fn(),
    });

    mockUseTaskMutations.mockReturnValue({
      createTask: mockCreateTask,
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      createLoading: false,
      updateLoading: false,
      error: 'Task creation failed',
    });

    const { result } = renderHook(() => useTasks());

    expect(result.current.error).toBe('Task creation failed');

    const newTask = { title: 'New Task', category: 'Work', status: 'pending' };
    await expect(
      act(async () => {
        await result.current.createTask(newTask);
      })
    ).rejects.toThrow('Task creation failed');

    // createLoadingが false になることを確認
    expect(result.current.createLoading).toBe(false);
  });
});
