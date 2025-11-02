import React, { useState } from 'react';
import {
  Group,
  ActionIcon,
  Tooltip,
  TextInput,
  Select,
  Table,
} from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import { Task, UpdateTaskDto } from '@/types/task';
import { CreateCategoryDto } from '@/types/category';
import { statusOptions, priorityOptions } from '@/features/tasks/constants';
import { CreateCategoryModal } from '@/features/categories/components/CreateCategoryModal';

type MilestoneTaskEditableRowProps = {
  task: Task;
  onSave: (taskId: number, taskData: UpdateTaskDto) => Promise<void>;
  onCancel: () => void;
  onCreateCategory?: (categoryData: CreateCategoryDto) => Promise<void>;
  createCategoryLoading?: boolean;
};

export const MilestoneTaskEditableRow: React.FC<MilestoneTaskEditableRowProps> = ({
  task,
  onSave,
  onCancel,
  onCreateCategory,
  createCategoryLoading = false,
}) => {
  const [formData, setFormData] = useState<UpdateTaskDto>({
    title: task.title,
    dueDate: task.dueDate || null,
    status: task.status || null,
    priority: task.priority || null,
    categoryId: task.categoryId || null,
  });
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [saving, setSaving] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const handleSave = async () => {
    if (!formData.title || !formData.title.trim()) {
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
    field: keyof UpdateTaskDto,
    value: string | number | null
  ) => {
    setFormData((prev: UpdateTaskDto) => ({ ...prev, [field]: value }));
    if (field === 'title' && errors.title) {
      setErrors((prev: { title?: string }) => ({ ...prev, title: undefined }));
    }
  };

  const handleCreateCategory = async (categoryData: CreateCategoryDto) => {
    if (onCreateCategory) {
      await onCreateCategory(categoryData);
      setIsCategoryModalOpen(false);
    }
  };

  return (
    <>
      <Table.Td>
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
      </Table.Td>
      <Table.Td>
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
      </Table.Td>
      <Table.Td>
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
      </Table.Td>
      <Table.Td>
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
      </Table.Td>
      <Table.Td>
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
      </Table.Td>

      <CreateCategoryModal
        opened={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCreateCategory}
        loading={createCategoryLoading}
      />
    </>
  );
};

