import React, { useState } from 'react';
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
import { COLORS } from '../../constants/colors';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../hooks/useAuth';
import { TaskTable } from './TaskTable';
import { CreateTaskModal } from './';
import { CreateTaskData, UpdateTaskData } from './definitions/types';

const TaskList: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    filteredTasks,
    search,
    setSearch,
    sortBy,
    reverseSortDirection,
    loading,
    createLoading,
    error,
    setSorting,
    createTask,
    updateTask,
  } = useTasks();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  const handleEdit = (taskId: number) => {
    setEditingTaskId(taskId);
  };

  const handleSave = async (taskId: number, taskData: UpdateTaskData) => {
    try {
      await updateTask(taskId, taskData);
      setEditingTaskId(null);
    } catch (error) {
      console.error('タスク更新に失敗:', error);
    }
  };

  const handleCancel = () => {
    setEditingTaskId(null);
  };

  const handleDelete = (taskId: number) => {
    console.log('削除ボタンがクリックされました:', taskId);
    // TODO: 削除機能を実装
  };

  const handleAddTask = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateTask = async (taskData: CreateTaskData) => {
    try {
      await createTask(taskData);
      setIsCreateModalOpen(false);
    } catch (error) {
      // エラーはuseTasksフック内で処理されるため、ここでは特に何もしない
      console.error('タスク作成に失敗:', error);
    }
  };

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
          onChange={(event) => setSearch(event.currentTarget.value)}
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
          onClick={handleAddTask}
          color={COLORS.PRIMARY}
          variant="filled"
        >
          タスク追加
        </Button>
      </Group>

      <TaskTable
        tasks={filteredTasks}
        sortBy={sortBy}
        reverseSortDirection={reverseSortDirection}
        onSort={(key) => setSorting(key as any)}
        editingTaskId={editingTaskId}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />

      {filteredTasks.length > 0 && (
        <Text size="sm" c={COLORS.GRAY} ta="center" mt="sm">
          {filteredTasks.length}件のタスクを表示中
        </Text>
      )}

      <CreateTaskModal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        loading={createLoading}
      />
    </Container>
  );
};

export default TaskList;
