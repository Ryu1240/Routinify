import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from '@/lib/axios';
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
    it('GET /api/v1/routine_tasks/with_achievement_stats を呼び出し結果を返すこと', async () => {
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
      const mockData = [
        {
          id: 1,
          title: 'Task 1',
          categoryName: 'Cat1',
          achievementStats: mockStats,
        },
        {
          id: 2,
          title: 'Task 2',
          categoryName: 'Cat2',
          achievementStats: mockStats,
        },
      ];
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockData },
      });

      const result = await getAllRoutineTasksWithStats();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/routine_tasks/with_achievement_stats')
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('period=weekly')
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockData[0]);
      expect(result[1]).toEqual(mockData[1]);
    });

    it('period を monthly に指定した場合クエリに含めること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: [] },
      });

      await getAllRoutineTasksWithStats('monthly');

      const callUrl = (axios.get as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callUrl).toContain('period=monthly');
    });
  });
});
