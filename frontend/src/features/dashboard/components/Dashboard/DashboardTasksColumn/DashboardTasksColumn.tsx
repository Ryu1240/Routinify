import React, { useState } from 'react';
import {
  Card,
  Title,
  Text,
  Stack,
  Button,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { Task } from '@/types';
import { Milestone } from '@/types/milestone';
import { DashboardTaskCard } from '../DashboardTaskCard';
import { DashboardMilestoneCard } from '../DashboardMilestoneCard';
import { TaskStatus } from '@/types';

type TaskStatusType = 'pending' | 'in_progress';

type MilestoneWithTasks = {
  milestone: Milestone;
  tasks: Task[];
};

type DashboardTasksColumnProps = {
  title: string;
  tasks: Task[];
  milestonesWithTasks: MilestoneWithTasks[];
  taskStatus: TaskStatusType;
  borderColor: string;
  displayLimit?: number;
  onSetTaskStatusToCompleted?: (taskId: number) => Promise<void>;
  onToggleTaskStatus?: (
    taskId: number,
    currentStatus: TaskStatus | null
  ) => Promise<void>;
  onSetTaskStatusToPending?: (taskId: number) => Promise<void>;
};

export const DashboardTasksColumn: React.FC<DashboardTasksColumnProps> = ({
  title,
  tasks,
  milestonesWithTasks,
  taskStatus,
  borderColor,
  displayLimit = 10,
  onSetTaskStatusToCompleted,
  onToggleTaskStatus,
  onSetTaskStatusToPending,
}) => {
  const [showAll, setShowAll] = useState(false);
  const totalCount = tasks.length + milestonesWithTasks.length;
  const displayedTasks = showAll ? tasks : tasks.slice(0, displayLimit);
  const displayedMilestones = showAll
    ? milestonesWithTasks
    : milestonesWithTasks.slice(
        0,
        Math.max(0, displayLimit - tasks.length)
      );
  const hasMore = totalCount > displayLimit;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3} mb="md" size="h4">
        {title} {totalCount > 0 && `(${totalCount}件)`}
      </Title>
      <Stack gap="sm">
        {totalCount === 0 ? (
          <Text c="dimmed" size="sm">
            {taskStatus === 'pending'
              ? '未着手のタスクがありません'
              : '進行中のタスクがありません'}
          </Text>
        ) : (
          <>
            {displayedTasks.map((task) => (
              <DashboardTaskCard
                key={task.id}
                task={task}
                borderColor={borderColor}
                onSetTaskStatusToCompleted={onSetTaskStatusToCompleted}
                onToggleTaskStatus={onToggleTaskStatus}
                onSetTaskStatusToPending={onSetTaskStatusToPending}
              />
            ))}
            {displayedMilestones.map(({ milestone, tasks: msTasks }) => (
              <DashboardMilestoneCard
                key={milestone.id}
                milestone={milestone}
                tasks={msTasks}
                borderColor={borderColor}
                onSetTaskStatusToCompleted={onSetTaskStatusToCompleted}
                onToggleTaskStatus={onToggleTaskStatus}
                onSetTaskStatusToPending={onSetTaskStatusToPending}
              />
            ))}
            {hasMore && (
              <Button
                variant="subtle"
                size="sm"
                fullWidth
                onClick={() => setShowAll(!showAll)}
                rightSection={
                  showAll ? (
                    <IconChevronUp size={16} />
                  ) : (
                    <IconChevronDown size={16} />
                  )
                }
              >
                {showAll
                  ? '折りたたむ'
                  : `もっと見る (残り${totalCount - displayLimit}件)`}
              </Button>
            )}
          </>
        )}
      </Stack>
    </Card>
  );
};
