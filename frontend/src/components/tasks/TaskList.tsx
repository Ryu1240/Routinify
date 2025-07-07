import React from 'react';
import { 
  Table, 
  TextInput, 
  Group, 
  Text, 
  Badge, 
  Container,
  Loader,
  Alert,
  ActionIcon,
  Tooltip,
  Button,
  Title
} from '@mantine/core';
import { IconSearch, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import { COLORS } from '../../constants/colors';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../hooks/useAuth';
import { getPriorityColor, getStatusColor, getCategoryColor, formatDate } from '../../utils/taskUtils';
import { TableHeader } from './TableHeader';

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

  const rows = filteredTasks.map((task) => (
    <Table.Tr key={task.id}>
      <Table.Td>
        <Text fw={500}>{task.title}</Text>
      </Table.Td>
      <Table.Td>
        <Badge color={getCategoryColor(task.category)} variant="light">
          {task.category || '-'}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge color={getPriorityColor(task.priority)} variant="light">
          {task.priority || '-'}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge color={getStatusColor(task.status)} variant="light">
          {task.status || '-'}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c={COLORS.GRAY}>
          {formatDate(task.dueDate)}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c={COLORS.GRAY}>
          {formatDate(task.createdAt)}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="center">
          <Tooltip label="編集">
            <ActionIcon
              size="sm"
              variant="subtle"
              color={COLORS.PRIMARY}
              onClick={() => handleEdit(task.id)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="削除">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={() => handleDelete(task.id)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

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
      <Title order={2} mb="lg">タスク一覧</Title>
      
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

        <Table horizontalSpacing="md" verticalSpacing="sm" miw={700}>
          <Table.Thead>
            <Table.Tr>
              <TableHeader
                sorted={sortBy === 'title' ? (reverseSortDirection ? 'desc' : 'asc') : null}
                onSort={() => setSorting('title')}
              >
                タスク名
              </TableHeader>
              <TableHeader
                sorted={sortBy === 'category' ? (reverseSortDirection ? 'desc' : 'asc') : null}
                onSort={() => setSorting('category')}
              >
                カテゴリ
              </TableHeader>
              <TableHeader
                sorted={sortBy === 'priority' ? (reverseSortDirection ? 'desc' : 'asc') : null}
                onSort={() => setSorting('priority')}
              >
                優先度
              </TableHeader>
              <TableHeader
                sorted={sortBy === 'status' ? (reverseSortDirection ? 'desc' : 'asc') : null}
                onSort={() => setSorting('status')}
              >
                ステータス
              </TableHeader>
              <TableHeader
                sorted={sortBy === 'dueDate' ? (reverseSortDirection ? 'desc' : 'asc') : null}
                onSort={() => setSorting('dueDate')}
              >
                期限
              </TableHeader>
              <TableHeader
                sorted={sortBy === 'createdAt' ? (reverseSortDirection ? 'desc' : 'asc') : null}
                onSort={() => setSorting('createdAt')}
              >
                作成日
              </TableHeader>
              <TableHeader isActionHeader>
                操作
              </TableHeader>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text ta="center" c={COLORS.GRAY} py="xl">
                    {search ? '検索条件に一致するタスクが見つかりませんでした' : 'タスクがありません'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        {filteredTasks.length > 0 && (
          <Text size="sm" c={COLORS.GRAY} ta="center" mt="sm">
            {filteredTasks.length}件のタスクを表示中
          </Text>
        )}
    </Container>
  );
};

export default TaskList; 