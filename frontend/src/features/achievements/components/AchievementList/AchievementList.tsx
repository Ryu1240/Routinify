import React from 'react';
import { Box, Title, Text, Card, Group, Stack, Badge } from '@mantine/core';
import { RoutineTaskWithStats } from '@/types/achievement';
import { AchievementBadge } from '../AchievementBadge';
import { AchievementProgressBar } from '../AchievementProgressBar';

export type AchievementListProps = {
  routineTasksWithStats: RoutineTaskWithStats[];
  isLoading: boolean;
  error: string | null;
  onTaskClick: (id: number) => void;
};

export const AchievementList: React.FC<AchievementListProps> = ({
  routineTasksWithStats,
  isLoading,
  error,
  onTaskClick,
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

  if (routineTasksWithStats.length === 0) {
    return (
      <Box p="md">
        <Title order={2} mb="md">
          習慣化状況
        </Title>
        <Text c="dimmed">習慣化タスクがありません</Text>
      </Box>
    );
  }

  return (
    <Box p="md">
      <Title order={2} mb="md">
        習慣化状況
      </Title>

      <Stack gap="md">
        {routineTasksWithStats.map((task) => {
          const { achievementStats } = task;
          const hasData = achievementStats.totalCount > 0;

          return (
            <Card
              key={task.id}
              shadow="sm"
              p="md"
              style={{ cursor: 'pointer' }}
              onClick={() => onTaskClick(task.id)}
            >
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Text fw={500} size="lg" mb="xs">
                      {task.title}
                    </Text>
                    {task.categoryName && (
                      <Text size="sm" c="dimmed" mb="sm">
                        カテゴリ: {task.categoryName}
                      </Text>
                    )}
                  </Box>
                </Group>

                {hasData ? (
                  <>
                    <Box>
                      <Text size="sm" mb="xs">
                        達成率
                      </Text>
                      <AchievementProgressBar
                        achievementRate={achievementStats.achievementRate}
                      />
                    </Box>

                    <Group gap="sm">
                      <AchievementBadge
                        achievementRate={achievementStats.achievementRate}
                      />
                      {achievementStats.consecutivePeriodsCount > 0 && (
                        <Badge color="blue" variant="light">
                          連続{achievementStats.consecutivePeriodsCount}週間
                        </Badge>
                      )}
                    </Group>
                  </>
                ) : (
                  <Box>
                    <Text size="sm" c="dimmed" mb="xs">
                      達成率: 0%
                    </Text>
                    <Text size="xs" c="dimmed">
                      データなし
                    </Text>
                  </Box>
                )}
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};
