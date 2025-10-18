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
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { COLORS } from '../../../constants/colors';
import { CreateTaskData } from '../definitions/types';
import { Category, CreateCategoryData } from '../../../types/category';
import { statusOptions, priorityOptions } from '../constants';
import { useCreateTaskForm } from './useCreateTaskForm';
import CreateCategoryModal from '../../categories/CreateCategoryModal';

interface CreateTaskModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (taskData: CreateTaskData) => Promise<void>;
  loading?: boolean;
  categories?: Category[];
  onCreateCategory?: (categoryData: CreateCategoryData) => Promise<void>;
  createCategoryLoading?: boolean;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  opened,
  onClose,
  onSubmit,
  loading = false,
  categories = [],
  onCreateCategory,
  createCategoryLoading = false,
}) => {
  const {
    formData,
    errors,
    handleInputChange,
    validateForm,
    getSubmitData,
    resetForm,
  } = useCreateTaskForm();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const taskData = getSubmitData();
      await onSubmit(taskData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('タスク作成エラー:', error);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreateCategory = async (categoryData: CreateCategoryData) => {
    if (onCreateCategory) {
      await onCreateCategory(categoryData);
      setIsCategoryModalOpen(false);
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

          <Group align="flex-end" gap="xs">
            <Select
              label="カテゴリ"
              placeholder="カテゴリを選択してください"
              data={categories.map((cat) => ({
                value: String(cat.id),
                label: cat.name,
              }))}
              value={formData.categoryId ? String(formData.categoryId) : null}
              onChange={(value) =>
                handleInputChange('categoryId', value ? Number(value) : null)
              }
              clearable
              searchable
              styles={{
                root: { flex: 1 },
                input: {
                  borderColor: COLORS.LIGHT,
                  '&:focus': {
                    borderColor: COLORS.PRIMARY,
                  },
                },
              }}
            />
            {onCreateCategory && (
              <Tooltip label="新しいカテゴリを作成">
                <ActionIcon
                  size="lg"
                  variant="light"
                  color={COLORS.PRIMARY}
                  onClick={() => setIsCategoryModalOpen(true)}
                >
                  <IconPlus size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>

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

      <CreateCategoryModal
        opened={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCreateCategory}
        loading={createCategoryLoading}
      />
    </Modal>
  );
};

export default CreateTaskModal;
