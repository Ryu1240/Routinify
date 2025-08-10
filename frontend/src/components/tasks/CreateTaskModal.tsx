import React, { useState } from 'react';
import {
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Title,
  Loader,
} from '@mantine/core';
import { COLORS } from '../../constants/colors';
import { CreateTaskData } from './definitions/types';

interface CreateTaskModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (taskData: CreateTaskData) => Promise<void>;
  loading?: boolean;
}

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

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  opened,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    dueDate: null,
    status: '未着手',
    priority: 'medium',
    category: '',
  });
  const [errors, setErrors] = useState<{ title?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!formData.title.trim()) {
      setErrors({ title: 'タスク名は必須です' });
      return;
    }

    try {
      const taskData = {
        ...formData,
        dueDate: formData.dueDate || null,
        category: formData.category?.trim() || null,
      };

      await onSubmit(taskData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('タスク作成エラー:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      dueDate: null,
      status: '未着手',
      priority: 'medium',
      category: '',
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (
    field: keyof CreateTaskData,
    value: string | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'title' && errors.title) {
      setErrors((prev) => ({ ...prev, title: undefined }));
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Title order={3} c={COLORS.PRIMARY}>
          新しいタスクを作成
        </Title>
      }
      size="md"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="タスク名"
            placeholder="タスク名を入力してください"
            withAsterisk
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.currentTarget.value)}
            error={errors.title}
            styles={{
              input: {
                borderColor: COLORS.LIGHT,
                '&:focus': {
                  borderColor: COLORS.PRIMARY,
                },
              },
            }}
          />

          <TextInput
            label="期限日"
            placeholder="YYYY-MM-DD形式で入力してください"
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

          <Select
            label="ステータス"
            data={statusOptions}
            value={formData.status}
            onChange={(value) => handleInputChange('status', value)}
            styles={{
              input: {
                borderColor: COLORS.LIGHT,
                '&:focus': {
                  borderColor: COLORS.PRIMARY,
                },
              },
            }}
          />

          <Select
            label="優先度"
            data={priorityOptions}
            value={formData.priority}
            onChange={(value) => handleInputChange('priority', value)}
            styles={{
              input: {
                borderColor: COLORS.LIGHT,
                '&:focus': {
                  borderColor: COLORS.PRIMARY,
                },
              },
            }}
          />

          <TextInput
            label="カテゴリ"
            placeholder="カテゴリを入力してください"
            value={formData.category || ''}
            onChange={(e) =>
              handleInputChange('category', e.currentTarget.value)
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

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              color={COLORS.PRIMARY}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              loading={loading}
              color={COLORS.PRIMARY}
              leftSection={loading ? <Loader size={16} /> : undefined}
            >
              作成
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
