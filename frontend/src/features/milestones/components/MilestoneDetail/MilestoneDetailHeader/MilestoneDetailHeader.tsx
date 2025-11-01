import React from 'react';
import { Group, Title, ActionIcon } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '@/shared/constants/colors';

export const MilestoneDetailHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Group mb="lg">
      <ActionIcon
        variant="subtle"
        color={COLORS.PRIMARY}
        onClick={() => navigate('/milestones')}
      >
        <IconArrowLeft size={20} />
      </ActionIcon>
      <Title order={2}>マイルストーン詳細</Title>
    </Group>
  );
};
