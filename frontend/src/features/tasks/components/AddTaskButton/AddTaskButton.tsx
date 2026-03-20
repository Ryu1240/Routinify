import React from 'react';
import { Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';

type AddTaskButtonProps = {
  onClick: () => void;
};

export const AddTaskButton: React.FC<AddTaskButtonProps> = ({ onClick }) => {
  return (
    <Button
      leftSection={<IconPlus size={16} />}
      onClick={onClick}
      color={COLORS.PRIMARY}
      variant="filled"
    >
      タスク追加
    </Button>
  );
};
