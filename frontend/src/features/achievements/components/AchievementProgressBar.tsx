import React from 'react';
import { Progress, Group, Text } from '@mantine/core';

interface AchievementProgressBarProps {
  achievementRate: number;
}

export const AchievementProgressBar: React.FC<AchievementProgressBarProps> = ({
  achievementRate,
}) => {
  // 達成率に応じた色を決定
  const getColor = (): string => {
    if (achievementRate >= 80) {
      return 'green';
    } else if (achievementRate >= 50) {
      return 'yellow';
    } else {
      return 'red';
    }
  };

  return (
    <Group gap="xs" align="center">
      <Progress
        value={achievementRate}
        color={getColor()}
        size="lg"
        radius="md"
        style={{ flex: 1 }}
      />
      <Text size="sm" fw={500} c="dimmed">
        {achievementRate.toFixed(1)}%
      </Text>
    </Group>
  );
};
