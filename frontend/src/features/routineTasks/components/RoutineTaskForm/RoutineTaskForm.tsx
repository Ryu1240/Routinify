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
  dueDateOffsetDays: number | string | null;
  dueDateOffsetHour: number | string | null;
  startGenerationAt: Date | null;
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
  isGenerated?: boolean;
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
  isGenerated = false,
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
                onInputChange('nextGenerationAt', value);
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

          <Box>
            <Title order={4} mb="sm">
              期限設定（任意）
            </Title>
            <Group gap="md">
              <NumberInput
                label="期限の日"
                placeholder="日数"
                value={formData.dueDateOffsetDays ?? undefined}
                onChange={(value) => onInputChange('dueDateOffsetDays', value)}
                min={0}
                style={{ flex: 1 }}
              />
              <NumberInput
                label="期限の時"
                placeholder="0-23"
                value={formData.dueDateOffsetHour ?? undefined}
                onChange={(value) => onInputChange('dueDateOffsetHour', value)}
                min={0}
                max={23}
                style={{ flex: 1 }}
              />
            </Group>
            <Box mt="xs" style={{ fontSize: '0.875rem', color: '#666' }}>
              指定された期限の日と時を生成日に加算して期限日時とします
            </Box>
          </Box>

          <DateTimePicker
            label="開始期限"
            placeholder="開始期限を選択"
            value={formData.startGenerationAt}
            onChange={(value) => {
              onInputChange('startGenerationAt', value);
            }}
            required
            disabled={isEditMode && isGenerated}
            description={
              isEditMode && isGenerated
                ? '一度でも生成が行われると変更できません'
                : 'この日からタスクの生成が始まります'
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
