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
  ActionIcon,
  Tabs,
} from '@mantine/core';
import { IconArrowLeft, IconChartLine, IconChartBar } from '@tabler/icons-react';
import { AchievementProgressBar } from '../AchievementProgressBar';
import { PeriodSelector, PeriodType } from '../PeriodSelector';
import { AchievementTrendChart } from '../AchievementTrendChart';
import { AchievementStats, AchievementTrendData } from '@/types/achievement';
import { COLORS } from '@/shared/constants/colors';
import { formatDateStringToDisplay } from '@/shared/utils/dateUtils';

export type AchievementDetailProps = {
  routineTaskTitle: string;
  routineTaskCategoryName?: string | null;
  stats: AchievementStats | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
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
  // グラフ表示関連
  activeTab?: 'stats' | 'graph';
  onTabChange?: (tab: 'stats' | 'graph') => void;
  trendChartPeriod?: 'weekly' | 'monthly';
  onTrendChartPeriodChange?: (period: 'weekly' | 'monthly') => void;
  trendChartCount?: number;
  onTrendChartCountChange?: (count: number) => void;
  trendData?: AchievementTrendData[];
  trendLoading?: boolean;
  trendError?: string | null;
};

export const AchievementDetail: React.FC<AchievementDetailProps> = ({
  routineTaskTitle,
  routineTaskCategoryName,
  stats,
  isLoading,
  error,
  onBack,
  period,
  onPeriodChange,
  weeklyOffset,
  onWeeklyOffsetChange,
  monthlyOffset,
  onMonthlyOffsetChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  activeTab = 'stats',
  onTabChange,
  trendChartPeriod = 'weekly',
  onTrendChartPeriodChange,
  trendChartCount = 4,
  onTrendChartCountChange,
  trendData = [],
  trendLoading = false,
  trendError = null,
}) => {
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
        <Group mb="xs">
          <ActionIcon variant="subtle" color={COLORS.PRIMARY} onClick={onBack}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Box style={{ flex: 1 }}>
            <Title order={2} mb="xs">
              習慣化状況 &gt; {routineTaskTitle}
            </Title>
            {routineTaskCategoryName && (
              <Text size="sm" c="dimmed">
                カテゴリ: {routineTaskCategoryName}
              </Text>
            )}
          </Box>
        </Group>

        {/* メインタブ（達成状況 / グラフ） */}
        <Tabs
          value={activeTab}
          onChange={(value) => onTabChange?.(value as 'stats' | 'graph')}
        >
          <Tabs.List>
            <Tabs.Tab value="stats" leftSection={<IconChartBar size={16} />}>
              達成状況
            </Tabs.Tab>
            <Tabs.Tab value="graph" leftSection={<IconChartLine size={16} />}>
              達成率推移グラフ
            </Tabs.Tab>
          </Tabs.List>

          {/* 達成状況タブ */}
          <Tabs.Panel value="stats" pt="md">
            <Stack gap="md">
              {/* 期間選択タブ（達成状況タブ内） */}
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
                    {formatDateStringToDisplay(stats.startDate)} -{' '}
                    {formatDateStringToDisplay(stats.endDate)}
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
          </Tabs.Panel>

          {/* グラフタブ */}
          <Tabs.Panel value="graph" pt="md">
            <AchievementTrendChart
              data={trendData}
              isLoading={trendLoading}
              error={trendError}
              period={trendChartPeriod}
              onPeriodChange={onTrendChartPeriodChange || (() => {})}
              count={trendChartCount}
              onCountChange={onTrendChartCountChange || (() => {})}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Box>
  );
};
