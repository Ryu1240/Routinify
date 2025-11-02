import axios from '@/lib/axios';
import { AchievementStats, RoutineTaskWithStats } from '@/types/achievement';
import { routineTasksApi } from '@/features/routineTasks/api/routineTasksApi';

type AchievementStatsApiResponse = {
  success: boolean;
  data:
    | AchievementStats
    | {
        totalCount?: number;
        total_count?: number;
        completedCount?: number;
        completed_count?: number;
        incompleteCount?: number;
        incomplete_count?: number;
        overdueCount?: number;
        overdue_count?: number;
        achievementRate?: number;
        achievement_rate?: number;
        period?: string;
        startDate?: string;
        start_date?: string;
        endDate?: string;
        end_date?: string;
        consecutivePeriodsCount?: number;
        consecutive_periods_count?: number;
        averageCompletionDays?: number;
        average_completion_days?: number;
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

  // AchievementStats型の場合はそのまま返す
  if ('totalCount' in data && typeof data.totalCount === 'number') {
    return data as AchievementStats;
  }

  // バックエンドがsnake_caseで返す場合に備えてcamelCaseに変換
  const snakeCaseData = data as {
    total_count?: number;
    completed_count?: number;
    incomplete_count?: number;
    overdue_count?: number;
    achievement_rate?: number;
    period?: string;
    start_date?: string;
    end_date?: string;
    consecutive_periods_count?: number;
    average_completion_days?: number;
  };

  return {
    totalCount: snakeCaseData.total_count ?? 0,
    completedCount: snakeCaseData.completed_count ?? 0,
    incompleteCount: snakeCaseData.incomplete_count ?? 0,
    overdueCount: snakeCaseData.overdue_count ?? 0,
    achievementRate: snakeCaseData.achievement_rate ?? 0,
    period: (snakeCaseData.period ?? 'weekly') as
      | 'weekly'
      | 'monthly'
      | 'custom',
    startDate: String(snakeCaseData.start_date ?? ''),
    endDate: String(snakeCaseData.end_date ?? ''),
    consecutivePeriodsCount: snakeCaseData.consecutive_periods_count ?? 0,
    averageCompletionDays: snakeCaseData.average_completion_days ?? 0,
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
