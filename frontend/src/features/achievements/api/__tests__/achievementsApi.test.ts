import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from '@/lib/axios';
import { routineTasksApi } from '@/features/routineTasks/api/routineTasksApi';
import {
  getAchievementStats,
  getAchievementTrend,
  getAllRoutineTasksWithStats,
} from '../achievementsApi';
import type {
  AchievementStats,
  AchievementTrendData,
} from '@/types/achievement';

vi.mock('@/lib/axios');
vi.mock('@/features/routineTasks/api/routineTasksApi');

describe('achievementsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAchievementStats', () => {
    it('GET /api/v1/routine_tasks/:id/achievement_stats を呼び出し達成状況を返すこと', async () => {
      const mockStats: AchievementStats = {
        totalCount: 10,
        completedCount: 8,
        incompleteCount: 2,
        overdueCount: 0,
        achievementRate: 80,
        period: 'weekly',
        startDate: '2025-01-01',
        endDate: '2025-01-07',
        consecutivePeriodsCount: 3,
        averageCompletionDays: 1.5,
      };

      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockStats },
      });

      const result = await getAchievementStats(123);

      expect(axios.get).toHaveBeenCalledWith(
        '/api/v1/routine_tasks/123/achievement_stats'
      );
      expect(result).toEqual(mockStats);
    });

    it('params を渡した場合クエリ文字列として付与すること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: {} as AchievementStats },
      });

      await getAchievementStats(123, {
        period: 'monthly',
        start_date: '2025-01-01',
        end_date: '2025-01-31',
      });

      const callUrl = (axios.get as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callUrl).toContain('/api/v1/routine_tasks/123/achievement_stats?');
      expect(callUrl).toContain('period=monthly');
      expect(callUrl).toContain('start_date=2025-01-01');
      expect(callUrl).toContain('end_date=2025-01-31');
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      await expect(getAchievementStats(123)).rejects.toThrow('Network error');
    });
  });

  describe('getAchievementTrend', () => {
    it('GET /api/v1/routine_tasks/:id/achievement_trend を呼び出し推移データを返すこと', async () => {
      const mockTrend: AchievementTrendData[] = [
        {
          period: '2025-W01',
          achievementRate: 80,
          totalCount: 5,
          completedCount: 4,
        },
      ];

      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockTrend },
      });

      const result = await getAchievementTrend(123, {
        period: 'weekly',
        weeks: 4,
      });

      const callUrl = (axios.get as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callUrl).toContain('/api/v1/routine_tasks/123/achievement_trend?');
      expect(callUrl).toContain('period=weekly');
      expect(callUrl).toContain('weeks=4');
      expect(result).toEqual(mockTrend);
    });

    it('period が monthly の場合 months パラメータを付与すること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: [] },
      });

      await getAchievementTrend(123, {
        period: 'monthly',
        months: 6,
      });

      const callUrl = (axios.get as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callUrl).toContain('period=monthly');
      expect(callUrl).toContain('months=6');
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        getAchievementTrend(123, { period: 'weekly' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('getAllRoutineTasksWithStats', () => {
    it('routineTasksApi.fetchAll で取得した有効タスクに対し getAchievementStats を呼び出し結果を返すこと', async () => {
      const mockRoutineTasks = [
        {
          id: 1,
          title: 'Task 1',
          categoryName: 'Cat1',
          isActive: true,
        },
        {
          id: 2,
          title: 'Task 2',
          categoryName: 'Cat2',
          isActive: true,
        },
      ];
      vi.mocked(routineTasksApi.fetchAll).mockResolvedValue(
        mockRoutineTasks as Awaited<ReturnType<typeof routineTasksApi.fetchAll>>
      );

      const mockStats: AchievementStats = {
        totalCount: 10,
        completedCount: 8,
        incompleteCount: 2,
        overdueCount: 0,
        achievementRate: 80,
        period: 'weekly',
        startDate: '2025-01-01',
        endDate: '2025-01-07',
        consecutivePeriodsCount: 3,
        averageCompletionDays: 1.5,
      };
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockStats },
      });

      const result = await getAllRoutineTasksWithStats();

      expect(routineTasksApi.fetchAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        title: 'Task 1',
        categoryName: 'Cat1',
        achievementStats: mockStats,
      });
      expect(result[1]).toEqual({
        id: 2,
        title: 'Task 2',
        categoryName: 'Cat2',
        achievementStats: mockStats,
      });
    });

    it('isActive が false のタスクは結果に含めないこと', async () => {
      const mockRoutineTasks = [
        { id: 1, title: 'Active', categoryName: null, isActive: true },
        { id: 2, title: 'Inactive', categoryName: null, isActive: false },
      ];
      vi.mocked(routineTasksApi.fetchAll).mockResolvedValue(
        mockRoutineTasks as Awaited<ReturnType<typeof routineTasksApi.fetchAll>>
      );
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          data: {
            totalCount: 0,
            completedCount: 0,
            incompleteCount: 0,
            overdueCount: 0,
            achievementRate: 0,
            period: 'weekly',
            startDate: '',
            endDate: '',
            consecutivePeriodsCount: 0,
            averageCompletionDays: 0,
          },
        },
      });

      const result = await getAllRoutineTasksWithStats();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });
});
