import React from 'react';
import { Badge } from '@mantine/core';

interface AchievementBadgeProps {
  achievementRate: number;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievementRate,
}) => {
  // 達成率に応じたバッジのテキストと色を決定
  const getBadgeInfo = (): { label: string; color: string } => {
    if (achievementRate >= 80) {
      return { label: '良好', color: 'green' };
    } else if (achievementRate >= 50) {
      return { label: '要改善', color: 'yellow' };
    } else {
      return { label: '要努力', color: 'red' };
    }
  };

  const { label, color } = getBadgeInfo();

  return <Badge color={color}>{label}</Badge>;
};
