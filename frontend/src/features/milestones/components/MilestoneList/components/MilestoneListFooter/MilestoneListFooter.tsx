import React from 'react';
import { Text } from '@mantine/core';
import { COLORS } from '@/shared/constants/colors';

type MilestoneListFooterProps = {
  count: number;
};

export const MilestoneListFooter: React.FC<MilestoneListFooterProps> = ({
  count,
}) => {
  if (count === 0) return null;

  return (
    <Text size="sm" c={COLORS.GRAY} ta="center" mt="md">
      {count}件のマイルストーンを表示中
    </Text>
  );
};
