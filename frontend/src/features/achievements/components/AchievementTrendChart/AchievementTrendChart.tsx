import React from 'react';
import {
  Card,
  Stack,
  Select,
  NumberInput,
  Group,
  Text,
  Loader,
} from '@mantine/core';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AchievementTrendData } from '@/types/achievement';
import { COLORS } from '@/shared/constants/colors';
import { formatDateStringToDisplay } from '@/shared/utils/dateUtils';

export type AchievementTrendChartProps = {
  data: AchievementTrendData[];
  isLoading: boolean;
  error: string | null;
  period: 'weekly' | 'monthly';
  onPeriodChange: (period: 'weekly' | 'monthly') => void;
  count: number;
  onCountChange: (count: number) => void;
};

export const AchievementTrendChart: React.FC<AchievementTrendChartProps> = ({
  data,
  isLoading,
  error,
  period,
  onPeriodChange,
  count,
  onCountChange,
}) => {
  // グラフ用データを整形（期間を表示用に変換）
  // バックエンドからは古い順で返されるため、そのまま使用
  const chartData = data.map((item) => ({
    period: formatDateStringToDisplay(item.period) || item.period,
    date: item.period,
    achievementRate: item.achievementRate,
    totalCount: item.totalCount,
    completedCount: item.completedCount,
  }));

  // 期間選択のオプション
  const periodOptions = [
    { value: 'weekly', label: '週次' },
    { value: 'monthly', label: '月次' },
  ];

  // カウントの最小値・最大値
  const countMin = 1;
  const countMax = period === 'weekly' ? 52 : 24;

  if (isLoading) {
    return (
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Stack gap="md" align="center" py="xl">
          <Loader size="md" color={COLORS.PRIMARY} />
          <Text c="dimmed">グラフデータを読み込み中...</Text>
        </Stack>
      </Card>
    );
  }

  if (error) {
    return (
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Text c="red">{error}</Text>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Text c="dimmed">データがありません</Text>
      </Card>
    );
  }

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* コントロール */}
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Group gap="md" wrap="wrap">
            <Select
              label="期間"
              data={periodOptions}
              value={period}
              onChange={(value) =>
                onPeriodChange(value as 'weekly' | 'monthly')
              }
              styles={{
                input: {
                  borderColor: COLORS.LIGHT,
                  '&:focus': {
                    borderColor: COLORS.PRIMARY,
                  },
                },
              }}
            />
            <NumberInput
              label={period === 'weekly' ? '週数' : '月数'}
              value={count}
              onChange={(value) => {
                const numValue =
                  typeof value === 'string' ? parseInt(value, 10) : value;
                if (numValue !== undefined && !isNaN(numValue)) {
                  onCountChange(numValue);
                }
              }}
              min={countMin}
              max={countMax}
              styles={{
                input: {
                  borderColor: COLORS.LIGHT,
                  '&:focus': {
                    borderColor: COLORS.PRIMARY,
                  },
                },
              }}
            />
          </Group>
        </Group>

        {/* グラフ */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.LIGHT} />
            <XAxis
              dataKey="period"
              stroke={COLORS.DARK}
              tick={{ fill: COLORS.DARK }}
            />
            <YAxis
              domain={[0, 100]}
              stroke={COLORS.DARK}
              tick={{ fill: COLORS.DARK }}
              label={{
                value: '達成率 (%)',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: `1px solid ${COLORS.LIGHT}`,
                borderRadius: '4px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'achievementRate') {
                  return [`${value.toFixed(1)}%`, '達成率'];
                }
                return [value, name];
              }}
              labelFormatter={(label) => `期間: ${label}`}
            />
            <Legend />
            <Line
              type="linear"
              dataKey="achievementRate"
              stroke={COLORS.PRIMARY}
              strokeWidth={2}
              dot={{ fill: COLORS.PRIMARY, r: 4 }}
              activeDot={{ r: 6 }}
              name="達成率"
            />
          </LineChart>
        </ResponsiveContainer>
      </Stack>
    </Card>
  );
};
