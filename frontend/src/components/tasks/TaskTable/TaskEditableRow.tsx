import React, { useState } from 'react';
import {
  Text,
  Group,
  ActionIcon,
  Tooltip,
  TextInput,
  Select,
} from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { COLORS } from '../../../constants/colors';
import { formatDate } from '../../../utils/taskUtils';
import { DataTable } from '../../common/DataTable/index';
import { Task, UpdateTaskData } from '../definitions';
import { Category } from '../../../types/category';
import { statusOptions, priorityOptions } from '../constants';

interface TaskEditableRowProps {
  task: Task;
  onSave: (taskId: number, taskData: UpdateTaskData) => Promise<void>;
  onCancel: () => void;
  categories?: Category[];
}

export const TaskEditableRow: React.FC<TaskEditableRowProps> = ({
  task,
  onSave,
  onCancel,
  categories = [],
}) => {
  const [formData, setFormData] = useState<UpdateTaskData>({
    title: task.title,
    dueDate: task.dueDate || null,
    status: task.status || null,
    priority: task.priority || null,
    categoryId: task.categoryId || null,
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
    value: string | number | null
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
        <Select
          value={formData.categoryId ? String(formData.categoryId) : null}
          onChange={(value) =>
            handleInputChange('categoryId', value ? Number(value) : null)
          }
          data={categories.map((cat) => ({
            value: String(cat.id),
            label: cat.name,
          }))}
          placeholder="カテゴリ"
          clearable
          searchable
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
