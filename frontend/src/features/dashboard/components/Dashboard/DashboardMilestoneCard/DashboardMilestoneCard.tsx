import React, { useState } from 'react';
import { Card, Text, Stack, Group, Button, Collapse, Progress } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Milestone } from '@/types/milestone';
import { Task } from '@/types';
import { DashboardTaskCard } from '../DashboardTaskCard';
import { MILESTONE_STATUS_LABELS } from '@/types/milestone';

type DashboardMilestoneCardProps = {
  milestone: Milestone;
  tasks: Task[];
  borderColor: string;
  onSetTaskStatusToCompleted?: (taskId: number) => Promise<void>;
  onToggleTaskStatus?: (
    taskId: number,
    currentStatus: import('@/types').TaskStatus | null
  ) => Promise<void>;
  onSetTaskStatusToPending?: (taskId: number) => Promise<void>;
};

export const DashboardMilestoneCard: React.FC<DashboardMilestoneCardProps> = ({
  milestone,
  tasks,
  borderColor,
  onSetTaskStatusToCompleted,
  onToggleTaskStatus,
  onSetTaskStatusToPending,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      padding="md"
      radius="sm"
      withBorder
      style={{
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Text
              component={Link}
              to={`/milestones/${milestone.id}`}
              fw={600}
              style={{ flex: 1 }}
              variant="link"
              c="blue"
            >
              {milestone.name}
            </Text>
            <Text size="xs" c="dimmed">
              {MILESTONE_STATUS_LABELS[milestone.status]}・
              {milestone.completedTasksCount}/{milestone.totalTasksCount} 完了
            </Text>
          </Stack>
          <Button
            variant="subtle"
            size="xs"
            onClick={() => setExpanded(!expanded)}
            rightSection={
              expanded ? (
                <IconChevronUp size={14} />
              ) : (
                <IconChevronDown size={14} />
              )
            }
          >
            {expanded ? '折りたたむ' : '展開'}
          </Button>
        </Group>
        <Progress
          value={milestone.progressPercentage}
          size="sm"
          color={milestone.progressPercentage === 100 ? 'green' : 'blue'}
        />
        <Collapse in={expanded}>
          <Stack gap="sm" mt="xs">
            {tasks.map((task) => (
              <DashboardTaskCard
                key={task.id}
                task={task}
                borderColor={borderColor}
                onSetTaskStatusToCompleted={onSetTaskStatusToCompleted}
                onToggleTaskStatus={onToggleTaskStatus}
                onSetTaskStatusToPending={onSetTaskStatusToPending}
              />
            ))}
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
};
