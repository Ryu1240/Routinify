import React from 'react';
import { Text, Badge, Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { COLORS } from '../../constants/colors';
import { getPriorityColor, getStatusColor, getCategoryColor, formatDate } from '../../utils/taskUtils';
import { DataTable, TableColumn } from '../common/DataTable/index';
import { Task, TaskTableProps } from './definitions';

// タスクテーブルのカラム定義とレンダリング関数
const taskColumns: (TableColumn & { render: (task: Task, onEdit: (id: number) => void, onDelete: (id: number) => void) => React.ReactNode })[] = [
  {
    key: 'title',
    label: 'タスク名',
    sortable: true,
    render: (task) => <Text fw={500}>{task.title}</Text>
  },
  {
    key: 'category',
    label: 'カテゴリ',
    sortable: true,
    render: (task) => (
      <Badge color={getCategoryColor(task.category || null)} variant="light">
        {task.category || '-'}
      </Badge>
    )
  },
  {
    key: 'priority',
    label: '優先度',
    sortable: true,
    render: (task) => (
      <Badge color={getPriorityColor(task.priority || null)} variant="light">
        {task.priority || '-'}
      </Badge>
    )
  },
  {
    key: 'status',
    label: 'ステータス',
    sortable: true,
    render: (task) => (
      <Badge color={getStatusColor(task.status || null)} variant="light">
        {task.status || '-'}
      </Badge>
    )
  },
  {
    key: 'dueDate',
    label: '期限',
    sortable: true,
    render: (task) => (
      <Text size="sm" c={COLORS.GRAY}>
        {formatDate(task.dueDate || null)}
      </Text>
    )
  },
  {
    key: 'createdAt',
    label: '作成日',
    sortable: true,
    render: (task) => (
      <Text size="sm" c={COLORS.GRAY}>
        {formatDate(task.createdAt)}
      </Text>
    )
  },
  {
    key: 'actions',
    label: '操作',
    isAction: true,
    render: (task, onEdit, onDelete) => (
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
    )
  }
];

// テーブルヘッダー用のカラム定義（render関数を除外）
const tableColumns: TableColumn[] = taskColumns.map(({ render, ...column }) => column);

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  sortBy,
  reverseSortDirection,
  onSort,
  onEdit,
  onDelete
}) => {
  return (
    <DataTable>
      <DataTable.Thead>
        <DataTable.HeaderRow
          columns={tableColumns}
          sortBy={sortBy}
          reverseSortDirection={reverseSortDirection}
          onSort={onSort}
        />
      </DataTable.Thead>
      <DataTable.Tbody emptyMessage="タスクがありません" colSpan={7}>
        {tasks.map((task) => (
          <DataTable.Tr key={task.id}>
            {taskColumns.map((column) => (
              <DataTable.Td key={column.key}>
                {column.render(task, onEdit, onDelete)}
              </DataTable.Td>
            ))}
          </DataTable.Tr>
        ))}
      </DataTable.Tbody>
    </DataTable>
  );
}; 