import React from 'react';
import { Container } from '@mantine/core';
import { Milestone, UpdateMilestoneDto } from '@/types/milestone';
import { MilestoneDetailHeader } from './MilestoneDetailHeader/';
import { MilestoneInfoCard } from './MilestoneInfoCard/';
import { MilestoneTasksTable } from './MilestoneTasksTable/';

import { UpdateTaskDto } from '@/types/task';
import { CreateCategoryDto } from '@/types/category';

type MilestoneDetailProps = {
  milestone: Milestone;
  onEdit?: (milestoneData: UpdateMilestoneDto) => Promise<void>;
  onDelete?: () => void;
  onDissociateTask?: (taskIds: number[]) => Promise<void>;
  onAddTask?: () => void;
  onEditTask?: (taskId: number, taskData: UpdateTaskDto) => Promise<void>;
  editLoading?: boolean;
  dissociateLoading?: boolean;
  onCreateCategory?: (categoryData: CreateCategoryDto) => Promise<void>;
  createCategoryLoading?: boolean;
};

export const MilestoneDetail: React.FC<MilestoneDetailProps> = ({
  milestone,
  onEdit,
  onDelete,
  onDissociateTask,
  onAddTask,
  onEditTask,
  editLoading,
  dissociateLoading,
  onCreateCategory,
  createCategoryLoading = false,
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
        onEditTask={onEditTask}
        dissociateLoading={dissociateLoading}
        onCreateCategory={onCreateCategory}
        createCategoryLoading={createCategoryLoading}
      />
    </Container>
  );
};
