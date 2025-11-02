import React from 'react';
import { Progress, Group, Text } from '@mantine/core';

export type AchievementProgressBarProps = {
  achievementRate: number;
};

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
    <Group gap="xs" align="center" wrap="nowrap">
      <Progress
        value={achievementRate}
        color={getColor()}
        size="lg"
        radius="md"
        style={{ flex: 1, minWidth: 0 }}
      />
      <Text size="sm" fw={500} c="dimmed" style={{ whiteSpace: 'nowrap' }}>
        {achievementRate.toFixed(1)}%
      </Text>
    </Group>
  );
};

