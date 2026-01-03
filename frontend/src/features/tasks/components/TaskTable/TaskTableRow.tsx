import React from 'react';
import { Text, Badge, Group, ActionIcon, Tooltip, Stack } from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconFlag,
  IconCheck,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  getCategoryColor,
  formatDate,
} from '@/shared/utils/taskUtils';
import { DataTable } from '@/shared/components/DataTable/index';
import { Task, TaskStatus } from '@/types/task';
import { Category } from '@/types/category';
import { Milestone } from '@/types/milestone';

interface TaskTableRowProps {
  task: Task;
  onEdit: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  categories?: Category[];
  milestones?: Milestone[];
  taskMilestoneIds?: number[]; // このタスクが紐づいているマイルストーンIDの配列
  onOpenMilestoneModal?: (taskId: number) => void;
  onToggleStatus?: (
    taskId: number,
    currentStatus: TaskStatus | null
  ) => Promise<void>;
}

export const TaskTableRow: React.FC<TaskTableRowProps> = ({
  task,
  onEdit,
  onDelete,
  categories = [],
  milestones = [],
  taskMilestoneIds = [],
  onOpenMilestoneModal,
  onToggleStatus,
}) => {
  const categoryName = task.categoryId
    ? categories.find((cat) => cat.id === task.categoryId)?.name
    : null;

  const associatedMilestones = milestones.filter((m) =>
    taskMilestoneIds.includes(m.id)
  );

  return (
    <>
      <DataTable.Td>
        <Text fw={500}>{task.title}</Text>
      </DataTable.Td>
      <DataTable.Td>
        <Badge color={getCategoryColor(categoryName || null)} variant="light">
          {categoryName || '-'}
        </Badge>
      </DataTable.Td>
      <DataTable.Td>
        <Badge color={getPriorityColor(task.priority)} variant="light">
          {getPriorityLabel(task.priority)}
        </Badge>
      </DataTable.Td>
      <DataTable.Td>
        <Badge color={getStatusColor(task.status)} variant="light">
          {getStatusLabel(task.status)}
        </Badge>
      </DataTable.Td>
      <DataTable.Td>
        <Text size="sm" c={COLORS.GRAY}>
          {formatDate(task.dueDate || null)}
        </Text>
      </DataTable.Td>
      <DataTable.Td>
        <Text size="sm" c={COLORS.GRAY}>
          {formatDate(task.createdAt)}
        </Text>
      </DataTable.Td>
      <DataTable.Td>
        {associatedMilestones.length > 0 ? (
          <Stack gap="xs" align="flex-start">
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
          </Stack>
        ) : (
          <Text size="sm" c={COLORS.GRAY}>
            -
          </Text>
        )}
      </DataTable.Td>
      <DataTable.Td>
        <Group gap="xs" justify="center">
          {onToggleStatus && (
            <Tooltip
              label={
                task.status === 'completed'
                  ? '進行中に変更'
                  : task.status === 'in_progress'
                    ? '完了に変更'
                    : '進行中に変更'
              }
            >
              <ActionIcon
                size="sm"
                variant="subtle"
                color={task.status === 'completed' ? 'blue' : 'green'}
                onClick={() => onToggleStatus(task.id, task.status)}
              >
                {task.status === 'completed' ? (
                  <IconPlayerPlay size={16} />
                ) : (
                  <IconCheck size={16} />
                )}
              </ActionIcon>
            </Tooltip>
          )}
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
      </DataTable.Td>
    </>
  );
};
