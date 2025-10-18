import React from 'react';
import { Text, Badge, Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { COLORS } from '../../../constants/colors';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  getCategoryColor,
  formatDate,
} from '../../../utils/taskUtils';
import { DataTable } from '../../common/DataTable/index';
import { Task } from '../definitions';
import { Category } from '../../../types/category';

interface TaskTableRowProps {
  task: Task;
  onEdit: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  categories?: Category[];
}

export const TaskTableRow: React.FC<TaskTableRowProps> = ({
  task,
  onEdit,
  onDelete,
  categories = [],
}) => {
  const categoryName = task.categoryId
    ? categories.find((cat) => cat.id === task.categoryId)?.name
    : null;
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
        <Group gap="xs" justify="center">
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
