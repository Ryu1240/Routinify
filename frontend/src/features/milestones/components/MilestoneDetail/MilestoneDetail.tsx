import React from 'react';
import { Container } from '@mantine/core';
import { Milestone } from '@/types/milestone';
import { MilestoneDetailHeader } from './MilestoneDetailHeader';
import { MilestoneInfoCard } from './MilestoneInfoCard';
import { MilestoneTasksTable } from './MilestoneTasksTable';

type MilestoneDetailProps = {
  milestone: Milestone;
  onEdit?: () => void;
  onDelete?: () => void;
};

export const MilestoneDetail: React.FC<MilestoneDetailProps> = ({
  milestone,
  onEdit,
  onDelete,
}) => {
  const tasks = milestone.tasks || [];

  return (
    <Container size="xl" py="xl">
      <MilestoneDetailHeader />
      <MilestoneInfoCard
        milestone={milestone}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <MilestoneTasksTable tasks={tasks} />
    </Container>
  );
};
