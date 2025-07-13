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
import { COLORS } from '../../constants/colors';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../hooks/useAuth';
import { TaskTable } from './TaskTable';

const TaskList: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    filteredTasks,
    search,
    setSearch,
    sortBy,
    reverseSortDirection,
    loading,
    error,
    setSorting,
  } = useTasks();

  const handleEdit = (taskId: number) => {
    console.log('編集ボタンがクリックされました:', taskId);
    // TODO: 編集機能を実装
  };

  const handleDelete = (taskId: number) => {
    console.log('削除ボタンがクリックされました:', taskId);
    // TODO: 削除機能を実装
  };

  const handleAddTask = () => {
    console.log('タスク追加ボタンがクリックされました');
    // TODO: タスク追加機能を実装
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
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {filteredTasks.length > 0 && (
        <Text size="sm" c={COLORS.GRAY} ta="center" mt="sm">
          {filteredTasks.length}件のタスクを表示中
        </Text>
      )}
    </Container>
  );
};

export default TaskList;
