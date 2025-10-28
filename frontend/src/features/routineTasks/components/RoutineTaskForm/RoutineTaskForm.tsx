import React from 'react';
import {
  Box,
  Title,
  TextInput,
  Select,
  NumberInput,
  Button,
  Group,
  Switch,
  Stack,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { Category, RoutineTaskFrequency, RoutineTaskPriority } from '@/types';
import { frequencyOptions, priorityOptions } from '../../constants';

type FormData = {
  title: string;
  frequency: RoutineTaskFrequency;
  intervalValue: number | string;
  nextGenerationAt: Date;
  maxActiveTasks: number | string;
  categoryId: string | null;
  priority: RoutineTaskPriority | null;
  isActive: boolean;
};

type RoutineTaskFormProps = {
  isEditMode: boolean;
  formData: FormData;
  onInputChange: (
    field: keyof FormData,
    value: string | number | Date | boolean | null
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading: boolean;
  submitLoading: boolean;
  categories: Category[];
};

export const RoutineTaskForm: React.FC<RoutineTaskFormProps> = ({
  isEditMode,
  formData,
  onInputChange,
  onSubmit,
  onCancel,
  loading,
  submitLoading,
  categories,
}) => {
  const categoryOptions = categories.map((cat) => ({
    value: cat.id.toString(),
    label: cat.name,
  }));

  if (loading) {
    return (
      <Box p="md">
        <Title order={2}>読み込み中...</Title>
      </Box>
    );
  }

  return (
    <Box p="md" style={{ maxWidth: 600 }}>
      <Title order={2} mb="lg">
        {isEditMode ? '習慣化タスク編集' : '習慣化タスク作成'}
      </Title>

      <form onSubmit={onSubmit}>
        <Stack gap="md">
          <TextInput
            label="タイトル"
            placeholder="タイトルを入力"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.currentTarget.value)}
            required
          />

          <Select
            label="頻度"
            placeholder="頻度を選択"
            data={frequencyOptions}
            value={formData.frequency}
            onChange={(value) =>
              onInputChange('frequency', value as RoutineTaskFrequency)
            }
            required
          />

          {formData.frequency === 'custom' && (
            <NumberInput
              label="間隔 (日数)"
              placeholder="間隔を入力"
              value={formData.intervalValue}
              onChange={(value) => onInputChange('intervalValue', value)}
              min={1}
              required
            />
          )}

          <DateTimePicker
            label="次回生成日時"
            placeholder="次回生成日時を選択"
            value={formData.nextGenerationAt}
            onChange={(value) => {
              if (value) {
                // Mantine v8では文字列、v7ではDateオブジェクトを受け取る
                const date =
                  typeof value === 'string' ? new Date(value) : value;
                onInputChange('nextGenerationAt', date);
              }
            }}
            required
            disabled={isEditMode}
            description={
              isEditMode
                ? '編集時は変更できません（システムが自動管理）'
                : undefined
            }
          />

          <NumberInput
            label="最大未完了タスク数"
            placeholder="最大未完了タスク数を入力"
            value={formData.maxActiveTasks}
            onChange={(value) => onInputChange('maxActiveTasks', value)}
            min={1}
            required
          />

          <Select
            label="カテゴリ"
            placeholder="カテゴリを選択"
            data={categoryOptions}
            value={formData.categoryId}
            onChange={(value) => onInputChange('categoryId', value)}
            clearable
          />

          <Select
            label="優先度"
            placeholder="優先度を選択"
            data={priorityOptions}
            value={formData.priority}
            onChange={(value) =>
              onInputChange('priority', value as RoutineTaskPriority)
            }
            clearable
          />

          <Switch
            label="有効"
            checked={formData.isActive}
            onChange={(event) =>
              onInputChange('isActive', event.currentTarget.checked)
            }
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={onCancel}>
              キャンセル
            </Button>
            <Button type="submit" loading={submitLoading}>
              {isEditMode ? '更新' : '作成'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
};
