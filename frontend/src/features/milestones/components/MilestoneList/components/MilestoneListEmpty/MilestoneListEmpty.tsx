import React from 'react';
import { Alert } from '@mantine/core';
import { COLORS } from '@/shared/constants/colors';

export const MilestoneListEmpty: React.FC = () => {
  return (
    <Alert
      title="マイルストーンがありません"
      color={COLORS.PRIMARY}
      variant="light"
    >
      マイルストーンが存在しません。
    </Alert>
  );
};
