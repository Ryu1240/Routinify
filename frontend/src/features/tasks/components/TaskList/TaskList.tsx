import React from 'react';
import {
  TextInput,
  Group,
  Text,
  Container,
  Loader,
  Alert,
  Button,
  Title,
} from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import { Task, UpdateTaskDto } from '@/types';
import { Category, CreateCategoryDto } from '@/types/category';
import { TaskTable } from '@/components/tasks/TaskTable/index';

type TaskListProps = {
  isAuthenticated: boolean;
  authLoading: boolean;
  tasks: Task[];
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string | null;
  reverseSortDirection: boolean;
  onSort: (key: string) => void;
  loading: boolean;
  error: string | null;
  editingTaskId: number | null;
  onEdit: (taskId: number) => void;
  onSave: (taskId: number, taskData: UpdateTaskDto) => Promise<void>;
  onCancel: () => void;
  onDelete: (taskId: number) => void;
  onAddTask: () => void;
  categories: Category[];
  onCreateCategory: (categoryData: CreateCategoryDto) => Promise<void>;
  createCategoryLoading: boolean;
};

export const TaskList: React.FC<TaskListProps> = ({
  isAuthenticated,
  authLoading,
  tasks,
  search,
  onSearchChange,
  sortBy,
  reverseSortDirection,
  onSort,
  loading,
  error,
  editingTaskId,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onAddTask,
  categories,
  onCreateCategory,
  createCategoryLoading,
}) => {
  if (authLoading || loading) {
    return (
      <Container size="xl" py="xl">
        <Group justify="center">
          <Loader size="lg" color={COLORS.PRIMARY} />
          <Text c={COLORS.MEDIUM}>
            {authLoading ? '認証情報を確認中...' : 'タスクを読み込み中...'}
          </Text>
        </Group>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container size="xl" py="xl">
        <Alert title="認証が必要" color={COLORS.PRIMARY} variant="light">
          タスク一覧を表示するにはログインが必要です。
        </Alert>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert title="エラー" color={COLORS.PRIMARY} variant="light">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="lg">
        タスク一覧
      </Title>

      <Group justify="space-between" mb="md">
        <TextInput
          placeholder="タスク名、カテゴリ、ステータスで検索..."
          leftSection={<IconSearch size={16} color={COLORS.PRIMARY} />}
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          styles={{
            input: {
              borderColor: COLORS.LIGHT,
              '&:focus': {
                borderColor: COLORS.PRIMARY,
              },
            },
          }}
          style={{ flex: 1 }}
        />
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={onAddTask}
          color={COLORS.PRIMARY}
          variant="filled"
        >
          タスク追加
        </Button>
      </Group>

      <TaskTable
        tasks={tasks}
        sortBy={sortBy}
        reverseSortDirection={reverseSortDirection}
        onSort={onSort}
        editingTaskId={editingTaskId}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        categories={categories}
        onCreateCategory={onCreateCategory}
        createCategoryLoading={createCategoryLoading}
      />

      {tasks.length > 0 && (
        <Text size="sm" c={COLORS.GRAY} ta="center" mt="sm">
          {tasks.length}件のタスクを表示中
        </Text>
      )}
    </Container>
  );
};
