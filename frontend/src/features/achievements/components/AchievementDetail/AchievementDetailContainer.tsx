import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { routineTasksApi } from '@/features/routineTasks/api/routineTasksApi';
import { RoutineTask } from '@/types';
import { useAchievementStats } from '../../hooks/useAchievementStats';
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

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(twoWeeksAgo),
      endDate: formatDate(today),
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

  const [routineTask, setRoutineTask] = useState<RoutineTask | null>(null);
  const [routineTaskLoading, setRoutineTaskLoading] = useState(false);
  const [routineTaskError, setRoutineTaskError] = useState<string | null>(null);

  // 週の開始日と終了日を計算
  const getWeekRange = (offset: number): { start: string; end: string } => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (日) から 6 (土)
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 月曜日を週の開始とする

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + mondayOffset + offset * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      start: formatDate(weekStart),
      end: formatDate(weekEnd),
    };
  };

  // 月の開始日と終了日を計算
  const getMonthRange = (offset: number): { start: string; end: string } => {
    const today = new Date();
    const monthStart = new Date(
      today.getFullYear(),
      today.getMonth() + offset,
      1
    );
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(
      today.getFullYear(),
      today.getMonth() + offset + 1,
      0
    );
    monthEnd.setHours(23, 59, 59, 999);

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      start: formatDate(monthStart),
      end: formatDate(monthEnd),
    };
  };

  // 期間に応じた開始日・終了日を計算
  const { startDate, endDate } = useMemo(() => {
    if (period === 'weekly') {
      const range = getWeekRange(weeklyOffset);
      return { startDate: range.start, endDate: range.end };
    } else if (period === 'monthly') {
      const range = getMonthRange(monthlyOffset);
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
    />
  );
};
