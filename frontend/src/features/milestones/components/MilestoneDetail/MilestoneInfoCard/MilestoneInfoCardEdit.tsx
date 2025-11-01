import React from 'react';
import {
  Card,
  Group,
  Stack,
  Button,
  TextInput,
  Textarea,
  Select,
  Loader,
} from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import {
  Milestone,
  MILESTONE_STATUS_LABELS,
  MilestoneStatus,
  UpdateMilestoneDto,
} from '@/types/milestone';
import { useMilestoneForm } from '@/features/milestones/hooks/useMilestoneForm';

type MilestoneInfoCardEditProps = {
  milestone: Milestone;
  onSave: (milestoneData: UpdateMilestoneDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
};

const statusOptions = Object.entries(MILESTONE_STATUS_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  })
);

export const MilestoneInfoCardEdit: React.FC<MilestoneInfoCardEditProps> = ({
  milestone,
  onSave,
  onCancel,
  loading = false,
}) => {
  const {
    formData,
    errors,
    handleInputChange,
    validateForm,
    getUpdateData,
  } = useMilestoneForm(milestone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const milestoneData = getUpdateData();
    await onSave(milestoneData);
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Group justify="space-between">
            <TextInput
              label="マイルストーン名"
              placeholder="マイルストーン名を入力してください"
              withAsterisk
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.currentTarget.value)}
              error={errors.name}
              style={{ flex: 1 }}
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
          </Group>

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

          <Group>
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
          </Group>

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              color={COLORS.PRIMARY}
              leftSection={<IconX size={16} />}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              loading={loading}
              color={COLORS.PRIMARY}
              leftSection={
                loading ? <Loader size={16} /> : <IconCheck size={16} />
              }
            >
              保存
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
};

