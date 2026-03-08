import React from 'react';
import {
  TextInput,
  Group,
  Text,
  Button,
  Title,
  Stack,
  Checkbox,
} from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import { ListPageState } from '@/shared/components';
import { Task, UpdateTaskDto, TaskStatus } from '@/types';
import { Category, CreateCategoryDto } from '@/types/category';
import { Milestone } from '@/types/milestone';
import { TaskTable } from '@/features/tasks/components/TaskTable';
import { TaskCard } from '@/features/tasks/components/TaskCard';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';

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
  onRetry?: () => void | Promise<void>;
  editingTaskId: number | null;
  onEdit: (taskId: number) => void;
  onSave: (taskId: number, taskData: UpdateTaskDto) => Promise<void>;
  onCancel: () => void;
  onDelete: (taskId: number) => void;
  onAddTask: () => void;
  categories: Category[];
  onCreateCategory: (categoryData: CreateCategoryDto) => Promise<void>;
  createCategoryLoading: boolean;
  milestones?: Milestone[];
  taskMilestoneMap?: Map<number, number[]>;
  onOpenMilestoneModal?: (taskId: number) => void;
  onToggleStatus?: (
    taskId: number,
    currentStatus: TaskStatus | null
  ) => Promise<void>;
  includeCompleted?: boolean;
  onIncludeCompletedChange?: (value: boolean) => void;
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
  milestones = [],
  taskMilestoneMap,
  onOpenMilestoneModal,
  onToggleStatus,
  onRetry,
  includeCompleted = false,
  onIncludeCompletedChange,
}) => {
  const isMobile = useIsMobile();

  if (authLoading || loading) {
    return (
      <ListPageState
        variant="loading"
        loadingMessage={
          authLoading ? '認証情報を確認中...' : 'タスクを読み込み中...'
        }
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <ListPageState
        variant="unauthenticated"
        unauthenticatedMessage="タスク一覧を表示するにはログインが必要です。"
      />
    );
  }

  if (error) {
    return (
      <ListPageState variant="error" errorMessage={error} onRetry={onRetry} />
    );
  }

  return (
    <>
      <Group align="center" gap="lg" mb="lg">
        <Title order={2}>タスク一覧</Title>
        {onIncludeCompletedChange && (
          <Checkbox
            label="完了を含める"
            checked={includeCompleted}
            onChange={(event) =>
              onIncludeCompletedChange(event.currentTarget.checked)
            }
          />
        )}
      </Group>

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

      {/* 編集モード中またはデスクトップ時はテーブル表示 */}
      {editingTaskId !== null || !isMobile ? (
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
          milestones={milestones}
          taskMilestoneMap={taskMilestoneMap}
          onOpenMilestoneModal={onOpenMilestoneModal}
          onToggleStatus={onToggleStatus}
        />
      ) : tasks.length > 0 ? (
        <Stack gap="md">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              categories={categories}
              milestones={milestones}
              taskMilestoneIds={taskMilestoneMap?.get(task.id) ?? []}
              onOpenMilestoneModal={onOpenMilestoneModal}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </Stack>
      ) : (
        <Text ta="center" c={COLORS.GRAY} py="xl">
          タスクがありません
        </Text>
      )}

      {tasks.length > 0 && (
        <Text size="sm" c={COLORS.GRAY} ta="center" mt="sm">
          {tasks.length}件のタスクを表示中
        </Text>
      )}
    </>
  );
};
