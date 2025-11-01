import React from 'react';
import { Container } from '@mantine/core';
import { Milestone, UpdateMilestoneDto } from '@/types/milestone';
import { MilestoneDetailHeader } from './MilestoneDetailHeader/';
import { MilestoneInfoCard } from './MilestoneInfoCard/';
import { MilestoneTasksTable } from './MilestoneTasksTable/';

type MilestoneDetailProps = {
  milestone: Milestone;
  onEdit?: (milestoneData: UpdateMilestoneDto) => Promise<void>;
  onDelete?: () => void;
  editLoading?: boolean;
};

export const MilestoneDetail: React.FC<MilestoneDetailProps> = ({
  milestone,
  onEdit,
  onDelete,
  editLoading,
}) => {
  const tasks = milestone.tasks || [];

  return (
    <Container size="xl" py="xl">
      <MilestoneDetailHeader />
      <MilestoneInfoCard
        milestone={milestone}
        onEdit={onEdit}
        onDelete={onDelete}
        loading={editLoading}
      />
      <MilestoneTasksTable tasks={tasks} />
    </Container>
  );
};
