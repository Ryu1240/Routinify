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
  onDissociateTask?: (taskId: number) => Promise<void>;
  onAddTask?: () => void;
  editLoading?: boolean;
  dissociateLoading?: boolean;
};

export const MilestoneDetail: React.FC<MilestoneDetailProps> = ({
  milestone,
  onEdit,
  onDelete,
  onDissociateTask,
  onAddTask,
  editLoading,
  dissociateLoading,
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
      <MilestoneTasksTable
        tasks={tasks}
        onDissociateTask={onDissociateTask}
        onAddTask={onAddTask}
        dissociateLoading={dissociateLoading}
      />
    </Container>
  );
};
