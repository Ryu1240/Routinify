import axios from '@/lib/axios';
import { AchievementStats, RoutineTaskWithStats } from '@/types/achievement';
import { formatDate } from '@/shared/utils/dateUtils';
import { routineTasksApi } from '@/features/routineTasks/api/routineTasksApi';

// APIレスポンス型（バックエンドはsnake_caseで返す）
type AchievementStatsApiResponse = {
  success: boolean;
  data: {
    total_count: number;
    completed_count: number;
    incomplete_count: number;
    overdue_count: number;
    achievement_rate: number;
    period: string;
    start_date: string | Date;
    end_date: string | Date;
    consecutive_periods_count: number;
    average_completion_days: number;
  };
};

/**
 * 習慣化タスクの達成状況を取得する
 * @param routineTaskId - 習慣化タスクID
 * @param params - 取得パラメータ
 * @returns 達成状況統計
 */
export const getAchievementStats = async (
  routineTaskId: number,
  params: {
    period?: 'weekly' | 'monthly' | 'custom';
    start_date?: string;
    end_date?: string;
  } = {}
): Promise<AchievementStats> => {
  const queryParams = new URLSearchParams();
  if (params.period) {
    queryParams.append('period', params.period);
  }
  if (params.start_date) {
    queryParams.append('start_date', params.start_date);
  }
  if (params.end_date) {
    queryParams.append('end_date', params.end_date);
  }

  const url = `/api/v1/routine_tasks/${routineTaskId}/achievement_stats${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  const response = await axios.get<AchievementStatsApiResponse>(url);
  const data = response.data.data;

  // start_dateとend_dateを文字列に変換（Dateオブジェクトの可能性に対応）
  const convertDateToString = (date: string | Date): string => {
    if (typeof date === 'string') return date;
    if (date instanceof Date) {
      const formatted = formatDate(date);
      if (formatted === null) {
        return date.toISOString().split('T')[0];
      }
      return formatted;
    }
    return String(date);
  };

  // バックエンドがsnake_caseで返すため、camelCaseに変換
  return {
    totalCount: data.total_count,
    completedCount: data.completed_count,
    incompleteCount: data.incomplete_count,
    overdueCount: data.overdue_count,
    achievementRate: data.achievement_rate,
    period: data.period as 'weekly' | 'monthly' | 'custom',
    startDate: convertDateToString(data.start_date),
    endDate: convertDateToString(data.end_date),
    consecutivePeriodsCount: data.consecutive_periods_count,
    averageCompletionDays: data.average_completion_days,
  };
};

/**
 * 全習慣化タスクを取得し、それぞれの週次達成率を並行取得する
 * @returns 達成状況付きの習慣化タスク一覧
 */
export const getAllRoutineTasksWithStats = async (): Promise<
  RoutineTaskWithStats[]
> => {
  // 全習慣化タスクを取得
  const routineTasks = await routineTasksApi.fetchAll();

  // 各タスクの週次達成率を並行取得
  const statsPromises = routineTasks.map(async (task) => {
    try {
      const stats = await getAchievementStats(task.id, { period: 'weekly' });
      return {
        id: task.id,
        title: task.title,
        categoryName: task.categoryName,
        achievementStats: stats,
      };
    } catch (error: unknown) {
      console.error(
        `習慣化タスク ${task.id} (${task.title}) の達成状況取得に失敗しました:`,
        error
      );
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { status?: number; data?: unknown };
        };
        if (axiosError.response) {
          console.error('レスポンスステータス:', axiosError.response.status);
          console.error('レスポンスデータ:', axiosError.response.data);
        }
      }
      // エラーが発生した場合はデフォルト値を返す
      return {
        id: task.id,
        title: task.title,
        categoryName: task.categoryName,
        achievementStats: {
          totalCount: 0,
          completedCount: 0,
          incompleteCount: 0,
          overdueCount: 0,
          achievementRate: 0,
          period: 'weekly' as const,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          consecutivePeriodsCount: 0,
          averageCompletionDays: 0,
        },
      };
    }
  });

  return Promise.all(statsPromises);
};
