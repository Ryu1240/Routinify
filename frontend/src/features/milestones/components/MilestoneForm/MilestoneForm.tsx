import React from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Loader,
} from '@mantine/core';
import { COLORS } from '@/shared/constants/colors';
import { CreateMilestoneDto, MilestoneStatus } from '@/types/milestone';
import { MILESTONE_STATUS_LABELS } from '@/types/milestone';
import { useMilestoneForm } from '../../hooks/useMilestoneForm';

type MilestoneFormProps = {
  opened: boolean;
  onClose: () => void;
  onSubmit: (milestoneData: CreateMilestoneDto) => Promise<void>;
  loading?: boolean;
};

const statusOptions = Object.entries(MILESTONE_STATUS_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  })
);

export const MilestoneForm: React.FC<MilestoneFormProps> = ({
  opened,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const {
    formData,
    errors,
    handleInputChange,
    validateForm,
    getSubmitData,
    resetForm,
  } = useMilestoneForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const milestoneData = getSubmitData();
      await onSubmit(milestoneData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('マイルストーン作成エラー:', error);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="新しいマイルストーンを作成"
      size="md"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="マイルストーン名"
            placeholder="マイルストーン名を入力してください"
            withAsterisk
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.currentTarget.value)}
            error={errors.name}
            styles={{
              input: {
                borderColor: COLORS.LIGHT,
                '&:focus': {
                  borderColor: COLORS.PRIMARY,
                },
              },
            }}
          />

          <Textarea
            label="説明"
            placeholder="説明を入力してください（任意）"
            value={formData.description || ''}
            onChange={(e) =>
              handleInputChange('description', e.currentTarget.value || null)
            }
            rows={3}
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
            label="開始日"
            placeholder="YYYY-MM-DD形式で入力してください（任意）"
            type="date"
            value={formData.startDate || ''}
            onChange={(e) =>
              handleInputChange('startDate', e.currentTarget.value || null)
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

          <TextInput
            label="期限日"
            placeholder="YYYY-MM-DD形式で入力してください（任意）"
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
            value={formData.status || 'planning'}
            onChange={(value) =>
              handleInputChange(
                'status',
                (value as MilestoneStatus) || 'planning'
              )
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
