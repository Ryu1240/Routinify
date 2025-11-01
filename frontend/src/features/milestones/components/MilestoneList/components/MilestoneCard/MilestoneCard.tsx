import React from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Progress,
  ActionIcon,
  Title,
} from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import { Milestone, MILESTONE_STATUS_LABELS } from '@/types/milestone';
import { getStatusColor, formatDate } from '../../utils';

type MilestoneCardProps = {
  milestone: Milestone;
  onEdit?: (milestoneId: number) => void;
  onDelete?: (milestoneId: number) => void;
};

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  onEdit,
  onDelete,
}) => {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Group>
          <Title order={4}>{milestone.name}</Title>
          <Badge color={getStatusColor(milestone.status)} variant="light">
            {MILESTONE_STATUS_LABELS[milestone.status]}
          </Badge>
        </Group>
        <Group gap="xs">
          {onEdit && (
            <ActionIcon
              variant="subtle"
              color={COLORS.PRIMARY}
              onClick={() => onEdit(milestone.id)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          )}
          {onDelete && (
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => onDelete(milestone.id)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      {milestone.description && (
        <Text size="sm" c="dimmed" mb="md">
          {milestone.description}
        </Text>
      )}

      <Group mb="md">
        <Text size="sm">
          <Text span fw={500}>
            開始日:
          </Text>{' '}
          {formatDate(milestone.startDate)}
        </Text>
        <Text size="sm">
          <Text span fw={500}>
            期限日:
          </Text>{' '}
          {formatDate(milestone.dueDate)}
        </Text>
        <Text size="sm">
          <Text span fw={500}>
            タスク:
          </Text>{' '}
          {milestone.completedTasksCount}/{milestone.totalTasksCount} 完了
        </Text>
      </Group>

      <Group gap="xs" align="center">
        <Progress
          value={milestone.progressPercentage}
          size="lg"
          radius="xl"
          color={
            milestone.progressPercentage === 100 ? 'green' : COLORS.PRIMARY
          }
          style={{ flex: 1 }}
        />
        <Text size="sm" fw={500} c="dimmed">
          {milestone.progressPercentage}%
        </Text>
      </Group>
    </Card>
  );
};
