import React from 'react';
import { Card, Text, Progress, Stack, Group, Badge } from '@mantine/core';
import { RoutineTaskWithStats } from '@/types/achievement';
import { AchievementBadge } from '@/features/achievements/components/AchievementBadge';

interface RoutineTaskStatsCardProps {
  routineTask: RoutineTaskWithStats;
}

export const RoutineTaskStatsCard: React.FC<RoutineTaskStatsCardProps> = ({
  routineTask,
}) => {
  const { title, categoryName, achievementStats } = routineTask;
  const { achievementRate, completedCount, incompleteCount, overdueCount } =
    achievementStats;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="sm">
        <div>
          <Text fw={600} size="lg" mb={4}>
            {title}
          </Text>
          {categoryName && (
            <Text size="sm" c="dimmed">
              {categoryName}
            </Text>
          )}
        </div>

        <Group justify="space-between" align="center">
          <Text size="sm" fw={500}>
            達成率
          </Text>
          <AchievementBadge achievementRate={achievementRate} />
        </Group>

        <Progress
          value={achievementRate}
          color={
            achievementRate >= 80
              ? 'green'
              : achievementRate >= 50
                ? 'yellow'
                : 'red'
          }
          size="lg"
          radius="xl"
        />

        <Group gap="md" mt="xs">
          <div>
            <Text size="xs" c="dimmed">
              完了
            </Text>
            <Text fw={600} size="sm">
              {completedCount}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              未完了
            </Text>
            <Text fw={600} size="sm">
              {incompleteCount}
            </Text>
          </div>
          {overdueCount > 0 && (
            <div>
              <Text size="xs" c="dimmed">
                期限超過
              </Text>
              <Badge color="red" size="sm">
                {overdueCount}
              </Badge>
            </div>
          )}
        </Group>
      </Stack>
    </Card>
  );
};
