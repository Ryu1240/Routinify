import React, { useState, useEffect } from 'react';
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
import { useNavigate, useParams } from 'react-router-dom';
import { useRoutineTasks, useCategories } from '@/shared/hooks';
import { Layout } from '@/shared/components';
import {
  CreateRoutineTaskDto,
  UpdateRoutineTaskDto,
  RoutineTaskFrequency,
  RoutineTaskPriority,
} from '@/types';
import { routineTasksApi } from '@/features/routineTasks/api/routineTasksApi';

export const RoutineTaskForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== undefined && id !== 'new';

  const { createRoutineTask, updateRoutineTask, createLoading, updateLoading } =
    useRoutineTasks();
  const { categories } = useCategories();

  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<RoutineTaskFrequency>('daily');
  const [intervalValue, setIntervalValue] = useState<number | string>(1);
  const [nextGenerationAt, setNextGenerationAt] = useState<Date>(new Date());
  const [maxActiveTasks, setMaxActiveTasks] = useState<number | string>(3);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [priority, setPriority] = useState<RoutineTaskPriority | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      routineTasksApi
        .fetchById(Number(id))
        .then((task) => {
          setTitle(task.title);
          setFrequency(task.frequency);
          setIntervalValue(task.intervalValue ?? 1);
          setNextGenerationAt(new Date(task.nextGenerationAt));
          setMaxActiveTasks(task.maxActiveTasks);
          setCategoryId(task.categoryId?.toString() ?? null);
          setPriority(task.priority);
          setIsActive(task.isActive);
        })
        .catch((error) => {
          console.error('習慣化タスクの取得に失敗:', error);
          alert('習慣化タスクの取得に失敗しました');
          navigate('/routine-tasks');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isEditMode, id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const routineTaskData: CreateRoutineTaskDto = {
      title,
      frequency,
      intervalValue:
        frequency === 'custom' ? Number(intervalValue) : null,
      nextGenerationAt: nextGenerationAt.toISOString(),
      maxActiveTasks: Number(maxActiveTasks),
      categoryId: categoryId ? Number(categoryId) : null,
      priority,
      isActive,
    };

    try {
      if (isEditMode && id) {
        await updateRoutineTask(Number(id), routineTaskData as UpdateRoutineTaskDto);
      } else {
        await createRoutineTask(routineTaskData);
      }
      navigate('/routine-tasks');
    } catch (error) {
      console.error('習慣化タスクの保存に失敗:', error);
    }
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id.toString(),
    label: cat.name,
  }));

  const frequencyOptions = [
    { value: 'daily', label: '毎日' },
    { value: 'weekly', label: '毎週' },
    { value: 'monthly', label: '毎月' },
    { value: 'custom', label: 'カスタム' },
  ];

  const priorityOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
  ];

  if (loading) {
    return (
      <Layout>
        <Box p="md">
          <Title order={2}>読み込み中...</Title>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box p="md" style={{ maxWidth: 600 }}>
        <Title order={2} mb="lg">
          {isEditMode ? '習慣化タスク編集' : '習慣化タスク作成'}
        </Title>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="タイトル"
              placeholder="タイトルを入力"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              required
            />

            <Select
              label="頻度"
              placeholder="頻度を選択"
              data={frequencyOptions}
              value={frequency}
              onChange={(value) =>
                setFrequency(value as RoutineTaskFrequency)
              }
              required
            />

            {frequency === 'custom' && (
              <NumberInput
                label="間隔 (日数)"
                placeholder="間隔を入力"
                value={intervalValue}
                onChange={setIntervalValue}
                min={1}
                required
              />
            )}

            <DateTimePicker
              label="次回生成日時"
              placeholder="次回生成日時を選択"
              value={nextGenerationAt}
              onChange={(value: Date | null) => value && setNextGenerationAt(value)}
              required
            />

            <NumberInput
              label="最大未完了タスク数"
              placeholder="最大未完了タスク数を入力"
              value={maxActiveTasks}
              onChange={setMaxActiveTasks}
              min={1}
              required
            />

            <Select
              label="カテゴリ"
              placeholder="カテゴリを選択"
              data={categoryOptions}
              value={categoryId}
              onChange={setCategoryId}
              clearable
            />

            <Select
              label="優先度"
              placeholder="優先度を選択"
              data={priorityOptions}
              value={priority}
              onChange={(value) => setPriority(value as RoutineTaskPriority)}
              clearable
            />

            <Switch
              label="有効"
              checked={isActive}
              onChange={(event) => setIsActive(event.currentTarget.checked)}
            />

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => navigate('/routine-tasks')}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                loading={createLoading || updateLoading}
              >
                {isEditMode ? '更新' : '作成'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Box>
    </Layout>
  );
};
