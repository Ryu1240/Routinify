import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  Button,
  Group,
  Title,
  Loader,
  Text,
  Table,
  Badge,
  TextInput,
  Stack,
  Alert,
  Checkbox,
} from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import { Task } from '@/types/task';
import { CreateTaskDto } from '@/types';
import { tasksApi } from '@/features/tasks/api/tasksApi';
import { handleApiError } from '@/shared/utils/apiErrorUtils';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  formatDate,
} from '@/shared/utils/taskUtils';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import { useCategories } from '@/shared/hooks/useCategories';

type AssociateTaskModalProps = {
  opened: boolean;
  onClose: () => void;
  onAssociate: (taskIds: number[]) => Promise<void>;
  loading?: boolean;
  associatedTaskIds?: number[];
};

export const AssociateTaskModal: React.FC<AssociateTaskModalProps> = ({
  opened,
  onClose,
  onAssociate,
  loading = false,
  associatedTaskIds = [],
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const {
    categories,
    createCategory,
    createLoading: categoryCreateLoading,
  } = useCategories();
  const associatedTaskIdsRef = useRef(associatedTaskIds);
  associatedTaskIdsRef.current = associatedTaskIds;

  const fetchTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      setError(null);
      const allTasks = await tasksApi.fetchAll(
        { include_completed: includeCompleted },
        true
      );
      const ids = associatedTaskIdsRef.current;
      const availableTasks = allTasks.filter((task) => !ids.includes(task.id));
      setTasks(availableTasks);
    } catch (err) {
      handleApiError(err, {
        defaultMessage:
          'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。',
      });
      setError(
        'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    } finally {
      setTasksLoading(false);
    }
  }, [includeCompleted]);

  useEffect(() => {
    if (opened) {
      fetchTasks();
    }
  }, [opened, fetchTasks]);

  useEffect(() => {
    if (opened) {
      setSearchQuery('');
      setSelectedTaskIds([]);
      setError(null);
    }
  }, [opened]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTasks(tasks);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTasks(
        tasks.filter(
          (task) =>
            task.title.toLowerCase().includes(query) ||
            task.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, tasks]);

  const handleToggleTask = (taskId: number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((task) => task.id));
    }
  };

  const handleAssociate = async () => {
    if (selectedTaskIds.length === 0) return;

    try {
      await onAssociate(selectedTaskIds);
      onClose();
    } catch (err) {
      handleApiError(err, {
        defaultMessage:
          'タスクの関連付けに失敗しました。しばらく時間をおいて再度お試しください。',
      });
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedTaskIds([]);
    setError(null);
    onClose();
  };

  const handleCreateTask = async (taskData: CreateTaskDto) => {
    try {
      setCreateLoading(true);
      const newTask = await tasksApi.create(taskData);
      setTasks((prev) => [newTask, ...prev]);
      setSelectedTaskIds((prev) => [...prev, newTask.id]);
      setIsCreateModalOpen(false);
      window.dispatchEvent(
        new CustomEvent('tasks-refresh', { detail: { silent: true } })
      );
    } catch (err) {
      handleApiError(err, {
        defaultMessage:
          'タスクの作成に失敗しました。しばらく時間をおいて再度お試しください。',
      });
      throw err;
    } finally {
      setCreateLoading(false);
    }
  };

  const allSelected =
    filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length;
  const someSelected =
    selectedTaskIds.length > 0 && selectedTaskIds.length < filteredTasks.length;

  const actionButtons = (
    <Group gap="xs">
      <Button variant="outline" onClick={handleClose} disabled={loading}>
        キャンセル
      </Button>
      <Button
        onClick={handleAssociate}
        loading={loading}
        disabled={selectedTaskIds.length === 0 || loading}
        color={COLORS.PRIMARY}
        leftSection={loading ? <Loader size={16} /> : <IconPlus size={16} />}
      >
        追加 ({selectedTaskIds.length})
      </Button>
    </Group>
  );

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group align="center" gap="lg">
          <Title order={3} c={COLORS.PRIMARY}>
            タスクを追加
          </Title>
          <Checkbox
            label="完了を含めて表示する"
            checked={includeCompleted}
            onChange={(event) => {
              setIncludeCompleted(event.currentTarget.checked);
            }}
          />
        </Group>
      }
      size="xl"
      centered
    >
      <Stack gap="md">
        <Group justify="space-between" gap="md">
          <TextInput
            placeholder="タスクを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
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
          <Button
            variant="light"
            color={COLORS.PRIMARY}
            leftSection={<IconPlus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            新規タスクを作成
          </Button>
        </Group>

        {error && (
          <Alert title="エラー" color="red" variant="light">
            {error}
          </Alert>
        )}

        {tasksLoading ? (
          <>
            <Group justify="center" py="xl">
              <Loader size="md" color={COLORS.PRIMARY} />
              <Text c={COLORS.MEDIUM}>タスクを読み込み中...</Text>
            </Group>
            <Group justify="flex-end" align="center">
              {actionButtons}
            </Group>
          </>
        ) : filteredTasks.length === 0 ? (
          <>
            <Text c="dimmed" ta="center" py="xl">
              {searchQuery.trim() === ''
                ? '関連付け可能なタスクがありません'
                : '検索結果が見つかりません'}
            </Text>
            <Group justify="flex-end" align="center">
              {actionButtons}
            </Group>
          </>
        ) : (
          <>
            {filteredTasks.length > 0 && (
              <Group justify="space-between" align="center">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleSelectAll}
                  label={`全選択 (${selectedTaskIds.length}/${filteredTasks.length})`}
                />
                {actionButtons}
              </Group>
            )}
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '40px' }}></Table.Th>
                  <Table.Th>タスク名</Table.Th>
                  <Table.Th>ステータス</Table.Th>
                  <Table.Th>期限日</Table.Th>
                  <Table.Th>優先度</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredTasks.map((task) => (
                  <Table.Tr
                    key={task.id}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedTaskIds.includes(task.id)
                        ? COLORS.LIGHT + '20'
                        : 'transparent',
                    }}
                    onClick={() => handleToggleTask(task.id)}
                  >
                    <Table.Td>
                      <Checkbox
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={() => handleToggleTask(task.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{task.title}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusColor(task.status)}
                        variant="light"
                      >
                        {getStatusLabel(task.status)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c={COLORS.GRAY}>
                        {formatDate(task.dueDate)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getPriorityColor(task.priority)}
                        variant="light"
                      >
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>
        )}
      </Stack>

      <CreateTaskModal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        loading={createLoading}
        categories={categories}
        onCreateCategory={createCategory}
        createCategoryLoading={categoryCreateLoading}
      />
    </Modal>
  );
};
