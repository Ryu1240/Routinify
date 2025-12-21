import React from 'react';
import {
  Card,
  Text,
  Badge,
  Group,
  ActionIcon,
  Tooltip,
  Stack,
  Divider,
} from '@mantine/core';
import { IconEdit, IconTrash, IconFlag } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  getCategoryColor,
  formatDate,
} from '@/shared/utils/taskUtils';
import { Task } from '@/types/task';
import { Category } from '@/types/category';
import { Milestone } from '@/types/milestone';

interface TaskCardProps {
  task: Task;
  onEdit: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  categories?: Category[];
  milestones?: Milestone[];
  taskMilestoneIds?: number[];
  onOpenMilestoneModal?: (taskId: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  categories = [],
  milestones = [],
  taskMilestoneIds = [],
  onOpenMilestoneModal,
}) => {
  const categoryName = task.categoryId
    ? categories.find((cat) => cat.id === task.categoryId)?.name
    : null;

  const associatedMilestones = milestones.filter((m) =>
    taskMilestoneIds.includes(m.id)
  );

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="sm">
        {/* タイトルとアクション */}
        <Group justify="space-between" align="flex-start">
          <Text fw={600} size="lg" style={{ flex: 1 }}>
            {task.title}
          </Text>
          <Group gap="xs">
            <Tooltip label="編集">
              <ActionIcon
                size="sm"
                variant="subtle"
                color={COLORS.PRIMARY}
                onClick={() => onEdit(task.id)}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
            {onOpenMilestoneModal && (
              <Tooltip label="マイルストーンを管理">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={COLORS.PRIMARY}
                  onClick={() => onOpenMilestoneModal(task.id)}
                >
                  <IconFlag size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label="削除">
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={() => onDelete(task.id)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* 説明 */}
        {task.description && (
          <Text size="sm" c="dimmed">
            {task.description}
          </Text>
        )}

        <Divider />

        {/* バッジ群 */}
        <Group gap="xs" wrap="wrap">
          {categoryName && (
            <Badge color={getCategoryColor(categoryName)} variant="light">
              {categoryName}
            </Badge>
          )}
          <Badge color={getPriorityColor(task.priority)} variant="light">
            {getPriorityLabel(task.priority)}
          </Badge>
          <Badge color={getStatusColor(task.status)} variant="light">
            {getStatusLabel(task.status)}
          </Badge>
        </Group>

        {/* マイルストーン */}
        {associatedMilestones.length > 0 && (
          <Stack gap="xs">
            <Text size="xs" fw={500} c="dimmed">
              マイルストーン:
            </Text>
            <Group gap="xs" wrap="wrap">
              {associatedMilestones.map((milestone) => (
                <Badge
                  key={milestone.id}
                  color={COLORS.PRIMARY}
                  variant="light"
                  leftSection={<IconFlag size={12} />}
                >
                  {milestone.name}
                </Badge>
              ))}
            </Group>
          </Stack>
        )}

        {/* 日付情報 */}
        <Group gap="md" justify="space-between">
          {task.dueDate && (
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                期限
              </Text>
              <Text size="sm" fw={500}>
                {formatDate(task.dueDate)}
              </Text>
            </Stack>
          )}
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              作成日
            </Text>
            <Text size="sm" c={COLORS.GRAY}>
              {formatDate(task.createdAt)}
            </Text>
          </Stack>
        </Group>
      </Stack>
    </Card>
  );
};
