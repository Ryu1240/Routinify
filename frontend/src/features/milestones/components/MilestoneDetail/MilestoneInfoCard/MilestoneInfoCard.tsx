import React, { useState } from 'react';
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
import { Milestone, UpdateMilestoneDto } from '@/types/milestone';
import {
  getStatusColor,
  formatDate,
} from '@/features/milestones/components/MilestoneList/utils/utils';
import { MILESTONE_STATUS_LABELS } from '@/types/milestone';
import { MilestoneInfoCardEdit } from './MilestoneInfoCardEdit';

type MilestoneInfoCardProps = {
  milestone: Milestone;
  onEdit?: (milestoneData: UpdateMilestoneDto) => Promise<void>;
  onDelete?: () => void;
  loading?: boolean;
};

export const MilestoneInfoCard: React.FC<MilestoneInfoCardProps> = ({
  milestone,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async (milestoneData: UpdateMilestoneDto) => {
    if (onEdit) {
      try {
        await onEdit(milestoneData);
        setIsEditing(false);
      } catch (error) {
        console.error('マイルストーン更新エラー:', error);
        throw error;
      }
    }
  };

  if (isEditing && onEdit) {
    return (
      <MilestoneInfoCardEdit
        key={`edit-${milestone.id}`}
        milestone={milestone}
        onSave={handleSave}
        onCancel={handleCancelEdit}
        loading={loading}
      />
    );
  }

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
              onClick={handleStartEdit}
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
