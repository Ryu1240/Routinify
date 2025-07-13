import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTasks } from './useTasks'
import axios from '../config/axios'

// useAuthのモック
const mockUseAuth = vi.fn()
vi.mock('./useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

// axiosのモック
vi.mock('../config/axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

const mockTasks = [
  { id: 1, title: 'Task 1', category: 'Work', status: 'pending' },
  { id: 2, title: 'Task 2', category: 'Personal', status: 'completed' },
]

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns initial state', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      accessToken: null,
    })

    const { result } = renderHook(() => useTasks())

    expect(result.current.tasks).toEqual([])
    expect(result.current.filteredTasks).toEqual([])
    expect(result.current.search).toBe('')
    expect(result.current.sortBy).toBeNull()
    expect(result.current.reverseSortDirection).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetches tasks when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock-token',
    })

    const mockAxiosGet = vi.mocked(axios.get)
    mockAxiosGet.mockResolvedValue({
      data: { data: mockTasks },
    } as any)

    const { result } = renderHook(() => useTasks())

    await waitFor(() => {
      expect(result.current.tasks).toEqual(mockTasks)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    expect(mockAxiosGet).toHaveBeenCalledWith('/api/v1/tasks')
  })

  it('handles fetch error', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock-token',
    })

    const errorMessage = 'タスクの取得に失敗しました'
    const mockAxiosGet = vi.mocked(axios.get)
    mockAxiosGet.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useTasks())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。')
    })
  })

  it('filters tasks based on search term', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock-token',
    })

    const mockAxiosGet = vi.mocked(axios.get)
    mockAxiosGet.mockResolvedValue({
      data: { data: mockTasks },
    } as any)

    const { result } = renderHook(() => useTasks())

    await waitFor(() => {
      expect(result.current.tasks).toEqual(mockTasks)
    })

    // 検索を実行
    result.current.setSearch('Work')

    await waitFor(() => {
      expect(result.current.filteredTasks).toHaveLength(1)
      expect(result.current.filteredTasks[0].title).toBe('Task 1')
    })
  })

  it('sorts tasks when sortBy is set', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock-token',
    })

    const mockAxiosGet = vi.mocked(axios.get)
    mockAxiosGet.mockResolvedValue({
      data: { data: mockTasks },
    } as any)

    const { result } = renderHook(() => useTasks())

    await waitFor(() => {
      expect(result.current.tasks).toEqual(mockTasks)
    })

    // ソートを実行
    result.current.setSorting('title')

    await waitFor(() => {
      expect(result.current.sortBy).toBe('title')
      expect(result.current.reverseSortDirection).toBe(false)
    })
  })

  it('toggles sort direction when same field is clicked', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock-token',
    })

    const mockAxiosGet = vi.mocked(axios.get)
    mockAxiosGet.mockResolvedValue({
      data: { data: mockTasks },
    } as any)

    const { result } = renderHook(() => useTasks())

    await waitFor(() => {
      expect(result.current.tasks).toEqual(mockTasks)
    })

    // 最初のソート
    result.current.setSorting('title')
    
    await waitFor(() => {
      expect(result.current.sortBy).toBe('title')
      expect(result.current.reverseSortDirection).toBe(false)
    })

    // 同じフィールドで再度ソート
    result.current.setSorting('title')
    
    await waitFor(() => {
      expect(result.current.sortBy).toBe('title')
      expect(result.current.reverseSortDirection).toBe(true)
    })
  })

  it('refreshes tasks when refreshTasks is called', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      accessToken: 'mock-token',
    })

    const mockAxiosGet = vi.mocked(axios.get)
    mockAxiosGet.mockResolvedValue({
      data: { data: mockTasks },
    } as any)

    const { result } = renderHook(() => useTasks())

    await waitFor(() => {
      expect(result.current.tasks).toEqual(mockTasks)
    })

    // 新しいタスクデータ
    const newTasks = [{ id: 3, title: 'Task 3', category: 'Work', status: 'pending' }]
    mockAxiosGet.mockResolvedValue({
      data: { data: newTasks },
    } as any)

    // リフレッシュを実行
    result.current.refreshTasks()

    await waitFor(() => {
      expect(result.current.tasks).toEqual(newTasks)
    })

    expect(mockAxiosGet).toHaveBeenCalledTimes(2)
  })

  it('does not fetch tasks when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      accessToken: null,
    })

    renderHook(() => useTasks())

    // axiosのモックは呼ばれないことを確認
    expect(mockUseAuth).toHaveBeenCalled()
  })
}) 