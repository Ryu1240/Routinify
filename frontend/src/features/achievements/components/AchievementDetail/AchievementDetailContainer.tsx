import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { routineTasksApi } from '@/features/routineTasks/api/routineTasksApi';
import { RoutineTask } from '@/types';
import {
  getWeekRangeStrings,
  getMonthRangeStrings,
  formatDate,
} from '@/shared/utils/dateUtils';
import { useAchievementStats } from '../../hooks/useAchievementStats';
import { useAchievementTrend } from '../../hooks/useAchievementTrend';
import { PeriodType } from '../PeriodSelector';
import { AchievementDetail } from './AchievementDetail';

export const AchievementDetailContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routineTaskId = id ? Number(id) : 0;

  // デフォルトの特定期間: 現在の日付から2週間前の期間
  const getDefaultCustomDateRange = (): {
    startDate: string;
    endDate: string;
  } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);

    const startDateStr = formatDate(twoWeeksAgo);
    const endDateStr = formatDate(today);

    if (!startDateStr || !endDateStr) {
      throw new Error('Failed to format default custom date range');
    }

    return {
      startDate: startDateStr,
      endDate: endDateStr,
    };
  };

  const defaultCustomDateRange = getDefaultCustomDateRange();

  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [weeklyOffset, setWeeklyOffset] = useState(0); // 0: 今週
  const [monthlyOffset, setMonthlyOffset] = useState(0); // 0: 今月
  const [customStartDate, setCustomStartDate] = useState<string | null>(
    defaultCustomDateRange.startDate
  );
  const [customEndDate, setCustomEndDate] = useState<string | null>(
    defaultCustomDateRange.endDate
  );

  // タブとグラフ表示関連の状態
  const [activeTab, setActiveTab] = useState<'stats' | 'graph'>('stats');
  const [trendChartPeriod, setTrendChartPeriod] = useState<
    'weekly' | 'monthly'
  >('weekly');
  const [trendChartCount, setTrendChartCount] = useState(4);

  const [routineTask, setRoutineTask] = useState<RoutineTask | null>(null);
  const [routineTaskLoading, setRoutineTaskLoading] = useState(false);
  const [routineTaskError, setRoutineTaskError] = useState<string | null>(null);

  // 期間に応じた開始日・終了日を計算
  const { startDate, endDate } = useMemo(() => {
    if (period === 'weekly') {
      const range = getWeekRangeStrings(weeklyOffset);
      return { startDate: range.start, endDate: range.end };
    } else if (period === 'monthly') {
      const range = getMonthRangeStrings(monthlyOffset);
      return { startDate: range.start, endDate: range.end };
    } else {
      // custom
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
      };
    }
  }, [period, weeklyOffset, monthlyOffset, customStartDate, customEndDate]);

  // ルーティンタスク情報を取得
  React.useEffect(() => {
    if (!routineTaskId) return;

    setRoutineTaskLoading(true);
    setRoutineTaskError(null);

    routineTasksApi
      .fetchById(routineTaskId)
      .then((task) => {
        setRoutineTask(task);
      })
      .catch((err) => {
        console.error('習慣化タスクの取得に失敗しました:', err);
        setRoutineTaskError('習慣化タスクの取得に失敗しました。');
      })
      .finally(() => {
        setRoutineTaskLoading(false);
      });
  }, [routineTaskId]);

  // 達成状況データを取得
  const {
    stats,
    loading: statsLoading,
    error: statsError,
  } = useAchievementStats(routineTaskId, period, startDate, endDate);

  // 達成率推移データを取得（グラフタブがアクティブな場合のみ）
  const {
    data: trendData,
    loading: trendLoading,
    error: trendError,
  } = useAchievementTrend(
    activeTab === 'graph' ? routineTaskId : 0,
    trendChartPeriod,
    trendChartCount
  );

  const handleCustomDateChange = (start: string | null, end: string | null) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  if (routineTaskLoading) {
    return (
      <div>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (routineTaskError || !routineTask) {
    return (
      <div>
        <p style={{ color: 'red' }}>
          {routineTaskError || '習慣化タスクが見つかりません'}
        </p>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/achievements');
  };

  return (
    <AchievementDetail
      routineTaskTitle={routineTask.title}
      routineTaskCategoryName={routineTask.categoryName}
      stats={stats}
      isLoading={statsLoading}
      error={statsError}
      onBack={handleBack}
      period={period}
      onPeriodChange={setPeriod}
      weeklyOffset={weeklyOffset}
      onWeeklyOffsetChange={setWeeklyOffset}
      monthlyOffset={monthlyOffset}
      onMonthlyOffsetChange={setMonthlyOffset}
      customStartDate={customStartDate}
      customEndDate={customEndDate}
      onCustomDateChange={handleCustomDateChange}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      trendChartPeriod={trendChartPeriod}
      onTrendChartPeriodChange={setTrendChartPeriod}
      trendChartCount={trendChartCount}
      onTrendChartCountChange={setTrendChartCount}
      trendData={trendData}
      trendLoading={trendLoading}
      trendError={trendError}
    />
  );
};
