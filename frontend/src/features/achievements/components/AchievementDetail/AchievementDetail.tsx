import React from 'react';
import {
  Box,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Badge,
  Divider,
} from '@mantine/core';
import { AchievementProgressBar } from '../AchievementProgressBar';
import { PeriodSelector, PeriodType } from '../PeriodSelector';
import { AchievementStats } from '@/types/achievement';

export interface AchievementDetailProps {
  routineTaskTitle: string;
  routineTaskCategoryName?: string | null;
  stats: AchievementStats | null;
  isLoading: boolean;
  error: string | null;
  // 期間選択関連
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  weeklyOffset: number;
  onWeeklyOffsetChange: (offset: number) => void;
  monthlyOffset: number;
  onMonthlyOffsetChange: (offset: number) => void;
  customStartDate: string | null;
  customEndDate: string | null;
  onCustomDateChange: (
    startDate: string | null,
    endDate: string | null
  ) => void;
}

export const AchievementDetail: React.FC<AchievementDetailProps> = ({
  routineTaskTitle,
  routineTaskCategoryName,
  stats,
  isLoading,
  error,
  period,
  onPeriodChange,
  weeklyOffset,
  onWeeklyOffsetChange,
  monthlyOffset,
  onMonthlyOffsetChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  if (isLoading) {
    return (
      <Box p="md">
        <Text>読み込み中...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p="md">
        <Text c="red">{error}</Text>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box p="md">
        <Text c="dimmed">データがありません</Text>
      </Box>
    );
  }

  return (
    <Box p="md">
      <Stack gap="md">
        {/* ヘッダー */}
        <Box>
          <Title order={2} mb="xs">
            習慣化状況 &gt; {routineTaskTitle}
          </Title>
          {routineTaskCategoryName && (
            <Text size="sm" c="dimmed">
              カテゴリ: {routineTaskCategoryName}
            </Text>
          )}
        </Box>

        {/* 期間選択タブ */}
        <PeriodSelector
          period={period}
          onPeriodChange={onPeriodChange}
          weeklyOffset={weeklyOffset}
          onWeeklyOffsetChange={onWeeklyOffsetChange}
          monthlyOffset={monthlyOffset}
          onMonthlyOffsetChange={onMonthlyOffsetChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={onCustomDateChange}
        />

        {/* 達成状況カード */}
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Stack gap="lg">
            {/* 達成率 */}
            <Box>
              <Text size="sm" mb="xs" fw={500}>
                達成率
              </Text>
              <AchievementProgressBar achievementRate={stats.achievementRate} />
            </Box>

            <Divider />

            {/* 期間表示 */}
            <Box>
              <Text size="sm" mb="xs" fw={500}>
                期間
              </Text>
              <Text size="sm">
                {formatDate(stats.startDate)} - {formatDate(stats.endDate)}
              </Text>
            </Box>

            <Divider />

            {/* 必須項目 */}
            <Group gap="xl">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  総タスク数
                </Text>
                <Text size="xl" fw={700}>
                  {stats.totalCount}
                </Text>
              </Box>
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  完了タスク数
                </Text>
                <Text size="xl" fw={700} c="green">
                  {stats.completedCount}
                </Text>
              </Box>
            </Group>

            {/* 連続達成バッジ */}
            {stats.consecutivePeriodsCount > 0 && (
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  連続達成
                </Text>
                <Badge color="blue" variant="light" size="lg">
                  {stats.consecutivePeriodsCount}
                  {period === 'weekly'
                    ? '週間'
                    : period === 'monthly'
                      ? 'ヶ月'
                      : '期間'}
                </Badge>
              </Box>
            )}

            <Divider />

            {/* オプション項目 */}
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  未完了タスク数
                </Text>
                <Text size="sm" fw={500}>
                  {stats.incompleteCount}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  期限切れタスク数
                </Text>
                <Text size="sm" fw={500} c="red">
                  {stats.overdueCount}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  平均完了日数
                </Text>
                <Text size="sm" fw={500}>
                  {stats.averageCompletionDays.toFixed(1)}日
                </Text>
              </Group>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
};
