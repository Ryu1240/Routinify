import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboard } from './useDashboard';
import { getAllRoutineTasksWithStats } from '@/features/achievements/api/achievementsApi';
import { useAuth } from '@/shared/hooks/useAuth';
import { RoutineTaskWithStats } from '@/types/achievement';

vi.mock('@/features/achievements/api/achievementsApi');
vi.mock('@/shared/hooks/useAuth');

describe('useDashboard', () => {
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

  it('習慣化タスク一覧と達成状況を正常に取得できること', async () => {
    const mockRoutineTasks: RoutineTaskWithStats[] = [
      {
        id: 1,
        title: 'Task 1',
        categoryName: 'Category 1',
        achievementStats: {
          totalCount: 10,
          completedCount: 8,
          incompleteCount: 2,
          overdueCount: 0,
          achievementRate: 80,
          period: 'weekly',
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          consecutivePeriodsCount: 3,
          averageCompletionDays: 1.5,
        },
      },
      {
        id: 2,
        title: 'Task 2',
        categoryName: 'Category 2',
        achievementStats: {
          totalCount: 10,
          completedCount: 9,
          incompleteCount: 1,
          overdueCount: 0,
          achievementRate: 90,
          period: 'weekly',
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          consecutivePeriodsCount: 5,
          averageCompletionDays: 1.2,
        },
      },
    ];

    vi.mocked(getAllRoutineTasksWithStats).mockResolvedValue(mockRoutineTasks);

    const { result } = renderHook(() => useDashboard());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.routineTasks).toHaveLength(2);
    expect(result.current.routineTasks[0].id).toBe(2); // 達成率が高い順
    expect(result.current.routineTasks[1].id).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('上位3つの習慣化タスクが正しく選択されること', async () => {
    const mockRoutineTasks: RoutineTaskWithStats[] = [
      {
        id: 1,
        title: 'Task 1',
        achievementStats: {
          totalCount: 10,
          completedCount: 5,
          incompleteCount: 5,
          overdueCount: 0,
          achievementRate: 50,
          period: 'weekly',
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          consecutivePeriodsCount: 1,
          averageCompletionDays: 2.0,
        },
      },
      {
        id: 2,
        title: 'Task 2',
        achievementStats: {
          totalCount: 10,
          completedCount: 9,
          incompleteCount: 1,
          overdueCount: 0,
          achievementRate: 90,
          period: 'weekly',
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          consecutivePeriodsCount: 5,
          averageCompletionDays: 1.2,
        },
      },
      {
        id: 3,
        title: 'Task 3',
        achievementStats: {
          totalCount: 10,
          completedCount: 8,
          incompleteCount: 2,
          overdueCount: 0,
          achievementRate: 80,
          period: 'weekly',
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          consecutivePeriodsCount: 3,
          averageCompletionDays: 1.5,
        },
      },
      {
        id: 4,
        title: 'Task 4',
        achievementStats: {
          totalCount: 10,
          completedCount: 7,
          incompleteCount: 3,
          overdueCount: 0,
          achievementRate: 70,
          period: 'weekly',
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          consecutivePeriodsCount: 2,
          averageCompletionDays: 1.8,
        },
      },
    ];

    vi.mocked(getAllRoutineTasksWithStats).mockResolvedValue(mockRoutineTasks);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.routineTasks).toHaveLength(3);
    expect(result.current.routineTasks[0].id).toBe(2); // 達成率90%
    expect(result.current.routineTasks[1].id).toBe(3); // 達成率80%
    expect(result.current.routineTasks[2].id).toBe(4); // 達成率70%
  });

  it('習慣化タスクが3つ未満の場合の動作', async () => {
    const mockRoutineTasks: RoutineTaskWithStats[] = [
      {
        id: 1,
        title: 'Task 1',
        achievementStats: {
          totalCount: 10,
          completedCount: 8,
          incompleteCount: 2,
          overdueCount: 0,
          achievementRate: 80,
          period: 'weekly',
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          consecutivePeriodsCount: 3,
          averageCompletionDays: 1.5,
        },
      },
    ];

    vi.mocked(getAllRoutineTasksWithStats).mockResolvedValue(mockRoutineTasks);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.routineTasks).toHaveLength(1);
  });

  it('エラーハンドリングが正しく動作すること', async () => {
    const mockError = new Error('Network error');
    vi.mocked(getAllRoutineTasksWithStats).mockRejectedValue(mockError);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.routineTasks).toHaveLength(0);
  });
});
