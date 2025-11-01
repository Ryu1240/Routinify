import React from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Progress,
  Stack,
  Button,
  Title,
} from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import { Milestone, MILESTONE_STATUS_LABELS } from '@/types/milestone';
import {
  getStatusColor,
  formatDate,
} from '@/features/milestones/components/MilestoneList/utils/utils';

type MilestoneInfoCardProps = {
  milestone: Milestone;
  onEdit?: () => void;
  onDelete?: () => void;
};

export const MilestoneInfoCard: React.FC<MilestoneInfoCardProps> = ({
  milestone,
  onEdit,
  onDelete,
}) => {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
      <Group justify="space-between" mb="md">
        <Group>
          <Title order={3}>{milestone.name}</Title>
          <Badge color={getStatusColor(milestone.status)} variant="light">
            {MILESTONE_STATUS_LABELS[milestone.status]}
          </Badge>
        </Group>
        <Group gap="xs">
          {onEdit && (
            <Button
              leftSection={<IconEdit size={16} />}
              variant="light"
              color={COLORS.PRIMARY}
              onClick={onEdit}
            >
              編集
            </Button>
          )}
          {onDelete && (
            <Button
              leftSection={<IconTrash size={16} />}
              variant="light"
              color="red"
              onClick={onDelete}
            >
              削除
            </Button>
          )}
        </Group>
      </Group>

      {milestone.description && (
        <Text size="md" c="dimmed" mb="md">
          {milestone.description}
        </Text>
      )}

      <Stack gap="md">
        <Group>
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
      </Stack>
    </Card>
  );
};
