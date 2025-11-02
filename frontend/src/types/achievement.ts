// 達成状況関連の型定義

export interface AchievementStats {
  totalCount: number;
  completedCount: number;
  incompleteCount: number;
  overdueCount: number;
  achievementRate: number;
  period: 'weekly' | 'monthly' | 'custom';
  startDate: string;
  endDate: string;
  consecutivePeriodsCount: number;
  averageCompletionDays: number;
}

export interface RoutineTaskWithStats {
  id: number;
  title: string;
  categoryName?: string | null;
  achievementStats: AchievementStats;
}
