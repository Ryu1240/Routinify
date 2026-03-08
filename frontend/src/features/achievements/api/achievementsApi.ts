import axios from '@/lib/axios';
import {
  AchievementStats,
  RoutineTaskWithStats,
  AchievementTrendData,
} from '@/types/achievement';

// APIレスポンス型（バックエンドはcamelCaseで返す）
type AchievementStatsApiResponse = {
  success: boolean;
  data: AchievementStats;
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

  // バックエンドからcamelCaseで返されるため、そのまま使用
  return response.data.data;
};

// APIレスポンス型（with_achievement_stats エンドポイント）
type RoutineTasksWithStatsApiResponse = {
  success: boolean;
  data: RoutineTaskWithStats[];
};

/**
 * 全習慣化タスクを達成状況付きで一括取得する
 * 新エンドポイント（1回のAPIリクエスト）を使用
 * @param period - 週次または月次（default: 'weekly'）
 * @returns 達成状況付きの習慣化タスク一覧（有効なもののみ）
 */
export const getAllRoutineTasksWithStats = async (
  period: 'weekly' | 'monthly' = 'weekly'
): Promise<RoutineTaskWithStats[]> => {
  const queryParams = new URLSearchParams();
  queryParams.append('period', period);

  const response = await axios.get<RoutineTasksWithStatsApiResponse>(
    `/api/v1/routine_tasks/with_achievement_stats?${queryParams.toString()}`
  );

  return response.data.data;
};

// APIレスポンス型（バックエンドはcamelCaseで返す）
type AchievementTrendApiResponse = {
  success: boolean;
  data: AchievementTrendData[];
};

/**
 * 習慣化タスクの達成率推移を取得する
 * @param routineTaskId - 習慣化タスクID
 * @param params - 取得パラメータ
 * @returns 達成率推移データ
 */
export const getAchievementTrend = async (
  routineTaskId: number,
  params: {
    period: 'weekly' | 'monthly';
    weeks?: number;
    months?: number;
  }
): Promise<AchievementTrendData[]> => {
  const queryParams = new URLSearchParams();
  queryParams.append('period', params.period);
  if (params.period === 'weekly' && params.weeks) {
    queryParams.append('weeks', params.weeks.toString());
  }
  if (params.period === 'monthly' && params.months) {
    queryParams.append('months', params.months.toString());
  }

  const url = `/api/v1/routine_tasks/${routineTaskId}/achievement_trend?${queryParams.toString()}`;

  const response = await axios.get<AchievementTrendApiResponse>(url);

  // バックエンドからcamelCaseで返されるため、そのまま使用
  return response.data.data;
};
