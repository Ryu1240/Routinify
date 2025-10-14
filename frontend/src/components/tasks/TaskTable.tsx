import React, { useState } from 'react';
import {
  Text,
  Badge,
  Group,
  ActionIcon,
  Tooltip,
  TextInput,
  Select,
} from '@mantine/core';
import { IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import { COLORS } from '../../constants/colors';
import {
  getPriorityColor,
  getStatusColor,
  getCategoryColor,
  formatDate,
} from '../../utils/taskUtils';
import { DataTable, TableColumn } from '../common/DataTable/index';
import { Task, TaskTableProps, UpdateTaskData } from './definitions';

const statusOptions = [
  { value: '未着手', label: '未着手' },
  { value: '進行中', label: '進行中' },
  { value: '完了', label: '完了' },
];

const priorityOptions = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
];

interface EditableRowProps {
  task: Task;
  onSave: (taskId: number, taskData: UpdateTaskData) => Promise<void>;
  onCancel: () => void;
}

const EditableRow: React.FC<EditableRowProps> = ({
  task,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<UpdateTaskData>({
    title: task.title,
    dueDate: task.dueDate || null,
    status: (task.status as any) || null,
    priority: (task.priority as any) || null,
    category: task.category || null,
  });
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setErrors({ title: 'タスク名は必須です' });
      return;
    }

    try {
      setSaving(true);
      await onSave(task.id, formData);
    } catch (error) {
      console.error('保存エラー:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof UpdateTaskData,
    value: string | null
  ) => {
    setFormData((prev: UpdateTaskData) => ({ ...prev, [field]: value }));
    if (field === 'title' && errors.title) {
      setErrors((prev: { title?: string }) => ({ ...prev, title: undefined }));
    }
  };

  return (
    <>
      <DataTable.Td>
        <TextInput
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.currentTarget.value)}
          error={errors.title}
          placeholder="タスク名を入力"
          styles={{
            input: {
              borderColor: errors.title ? 'red' : COLORS.LIGHT,
              '&:focus': {
                borderColor: errors.title ? 'red' : COLORS.PRIMARY,
              },
            },
          }}
        />
      </DataTable.Td>
      <DataTable.Td>
        <TextInput
          value={formData.category || ''}
          onChange={(e) => handleInputChange('category', e.currentTarget.value)}
          placeholder="カテゴリ"
          styles={{
            input: {
              borderColor: COLORS.LIGHT,
              '&:focus': {
                borderColor: COLORS.PRIMARY,
              },
            },
          }}
        />
      </DataTable.Td>
      <DataTable.Td>
        <Select
          value={formData.priority}
          onChange={(value) => handleInputChange('priority', value)}
          data={priorityOptions}
          placeholder="優先度"
          styles={{
            input: {
              borderColor: COLORS.LIGHT,
              '&:focus': {
                borderColor: COLORS.PRIMARY,
              },
            },
          }}
        />
      </DataTable.Td>
      <DataTable.Td>
        <Select
          value={formData.status}
          onChange={(value) => handleInputChange('status', value)}
          data={statusOptions}
          placeholder="ステータス"
          styles={{
            input: {
              borderColor: COLORS.LIGHT,
              '&:focus': {
                borderColor: COLORS.PRIMARY,
              },
            },
          }}
        />
      </DataTable.Td>
      <DataTable.Td>
        <TextInput
          type="date"
          value={formData.dueDate || ''}
          onChange={(e) =>
            handleInputChange('dueDate', e.currentTarget.value || null)
          }
          styles={{
            input: {
              borderColor: COLORS.LIGHT,
              '&:focus': {
                borderColor: COLORS.PRIMARY,
              },
            },
          }}
        />
      </DataTable.Td>
      <DataTable.Td>
        <Text size="sm" c={COLORS.GRAY}>
          {formatDate(task.createdAt)}
        </Text>
      </DataTable.Td>
      <DataTable.Td>
        <Group gap="xs" justify="center">
          <Tooltip label="保存">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="green"
              onClick={handleSave}
              loading={saving}
              disabled={saving}
            >
              <IconCheck size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="キャンセル">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={onCancel}
              disabled={saving}
            >
              <IconX size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </DataTable.Td>
    </>
  );
};

// タスクテーブルのカラム定義とレンダリング関数
const taskColumns: (TableColumn & {
  render: (
    task: Task,
    onEdit: (id: number) => void,
    onDelete: (id: number) => void
  ) => React.ReactNode;
})[] = [
  {
    key: 'title',
    label: 'タスク名',
    sortable: true,
    render: (task) => <Text fw={500}>{task.title}</Text>,
  },
  {
    key: 'category',
    label: 'カテゴリ',
    sortable: true,
    render: (task) => (
      <Badge color={getCategoryColor(task.category || null)} variant="light">
        {task.category || '-'}
      </Badge>
    ),
  },
  {
    key: 'priority',
    label: '優先度',
    sortable: true,
    render: (task) => (
      <Badge color={getPriorityColor(task.priority || null)} variant="light">
        {task.priority || '-'}
      </Badge>
    ),
  },
  {
    key: 'status',
    label: 'ステータス',
    sortable: true,
    render: (task) => (
      <Badge color={getStatusColor(task.status || null)} variant="light">
        {task.status || '-'}
      </Badge>
    ),
  },
  {
    key: 'dueDate',
    label: '期限',
    sortable: true,
    render: (task) => (
      <Text size="sm" c={COLORS.GRAY}>
        {formatDate(task.dueDate || null)}
      </Text>
    ),
  },
  {
    key: 'createdAt',
    label: '作成日',
    sortable: true,
    render: (task) => (
      <Text size="sm" c={COLORS.GRAY}>
        {formatDate(task.createdAt)}
      </Text>
    ),
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
    ),
  },
];

// テーブルヘッダー用のカラム定義（render関数を除外）
const tableColumns: TableColumn[] = taskColumns.map(
  ({ render, ...column }) => column
);

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  sortBy,
  reverseSortDirection,
  onSort,
  editingTaskId,
  onEdit,
  onSave,
  onCancel,
  onDelete,
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
            {editingTaskId === task.id ? (
              <EditableRow task={task} onSave={onSave} onCancel={onCancel} />
            ) : (
              <>
                {taskColumns.map((column) => (
                  <DataTable.Td key={column.key}>
                    {column.render(task, onEdit, onDelete)}
                  </DataTable.Td>
                ))}
              </>
            )}
          </DataTable.Tr>
        ))}
      </DataTable.Tbody>
    </DataTable>
  );
};
