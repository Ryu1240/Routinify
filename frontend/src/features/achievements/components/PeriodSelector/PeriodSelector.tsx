import React from 'react';
import { Tabs, Group, Button, Text, Stack } from '@mantine/core';
import { DateRangePicker } from '../DateRangePicker';

export type PeriodType = 'weekly' | 'monthly' | 'custom';

export type PeriodSelectorProps = {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  // 週次用
  weeklyOffset: number; // 0: 今週, -1: 先週, 1: 来週
  onWeeklyOffsetChange: (offset: number) => void;
  // 月次用
  monthlyOffset: number; // 0: 今月, -1: 先月, 1: 来月
  onMonthlyOffsetChange: (offset: number) => void;
  // 特定期間用
  customStartDate: string | null;
  customEndDate: string | null;
  onCustomDateChange: (
    startDate: string | null,
    endDate: string | null
  ) => void;
};

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
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
  // 週の開始日と終了日を計算
  const getWeekRange = (offset: number): { start: Date; end: Date } => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (日) から 6 (土)
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 月曜日を週の開始とする

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + mondayOffset + offset * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { start: weekStart, end: weekEnd };
  };

  // 月の開始日と終了日を計算
  const getMonthRange = (offset: number): { start: Date; end: Date } => {
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

    return { start: monthStart, end: monthEnd };
  };

  const formatDateRange = (start: Date, end: Date): string => {
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    };
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const weeklyRange = getWeekRange(weeklyOffset);
  const monthlyRange = getMonthRange(monthlyOffset);

  const getWeeklyLabel = (offset: number): string => {
    if (offset === 0) return '今週';
    if (offset === -1) return '先週';
    if (offset === 1) return '来週';
    return offset < 0 ? `${Math.abs(offset)}週前` : `${offset}週後`;
  };

  const getMonthlyLabel = (offset: number): string => {
    if (offset === 0) return '今月';
    if (offset === -1) return '先月';
    if (offset === 1) return '来月';
    return offset < 0 ? `${Math.abs(offset)}ヶ月前` : `${offset}ヶ月後`;
  };

  return (
    <Tabs
      value={period}
      onChange={(value) => onPeriodChange(value as PeriodType)}
    >
      <Tabs.List>
        <Tabs.Tab value="weekly">週次</Tabs.Tab>
        <Tabs.Tab value="monthly">月次</Tabs.Tab>
        <Tabs.Tab value="custom">特定期間</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="weekly" pt="md">
        <Group gap="sm" align="center">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => onWeeklyOffsetChange(weeklyOffset - 1)}
          >
            ←
          </Button>
          <Text size="sm" fw={500}>
            {getWeeklyLabel(weeklyOffset)}
          </Text>
          <Text size="sm" c="dimmed">
            ({formatDateRange(weeklyRange.start, weeklyRange.end)})
          </Text>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => onWeeklyOffsetChange(weeklyOffset + 1)}
          >
            →
          </Button>
        </Group>
      </Tabs.Panel>

      <Tabs.Panel value="monthly" pt="md">
        <Group gap="sm" align="center">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => onMonthlyOffsetChange(monthlyOffset - 1)}
          >
            ←
          </Button>
          <Text size="sm" fw={500}>
            {getMonthlyLabel(monthlyOffset)}
          </Text>
          <Text size="sm" c="dimmed">
            ({formatDateRange(monthlyRange.start, monthlyRange.end)})
          </Text>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => onMonthlyOffsetChange(monthlyOffset + 1)}
          >
            →
          </Button>
        </Group>
      </Tabs.Panel>

      <Tabs.Panel value="custom" pt="md">
        <Stack gap="xs">
          <DateRangePicker
            startDate={customStartDate}
            endDate={customEndDate}
            onDateChange={onCustomDateChange}
          />
          {!customStartDate || !customEndDate ? (
            <Text size="sm" c="dimmed">
              開始日と終了日を選択してください
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              期間: {customStartDate} 〜 {customEndDate}
            </Text>
          )}
        </Stack>
      </Tabs.Panel>
    </Tabs>
  );
};

