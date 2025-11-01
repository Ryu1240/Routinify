import React, { useState, useEffect } from 'react';
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
import { tasksApi } from '@/features/tasks/api/tasksApi';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  formatDate,
} from '@/shared/utils/taskUtils';

type AssociateTaskModalProps = {
  opened: boolean;
  onClose: () => void;
  onAssociate: (taskId: number) => Promise<void>;
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

  useEffect(() => {
    if (opened) {
      fetchTasks();
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

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      setError(null);
      const allTasks = await tasksApi.fetchAll(true);
      // 既に関連付けられているタスクを除外
      const availableTasks = allTasks.filter(
        (task) => !associatedTaskIds.includes(task.id)
      );
      setTasks(availableTasks);
    } catch (err) {
      console.error('タスクの取得に失敗しました:', err);
      setError(
        'タスクの取得に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    } finally {
      setTasksLoading(false);
    }
  };

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
      // 選択されたタスクを順番に関連付け
      for (const taskId of selectedTaskIds) {
        await onAssociate(taskId);
      }
      onClose();
    } catch (err) {
      console.error('タスクの関連付けに失敗:', err);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedTaskIds([]);
    setError(null);
    onClose();
  };

  const allSelected =
    filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length;
  const someSelected =
    selectedTaskIds.length > 0 && selectedTaskIds.length < filteredTasks.length;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Title order={3} c={COLORS.PRIMARY}>
          タスクを追加
        </Title>
      }
      size="xl"
      centered
    >
      <Stack gap="md">
        <TextInput
          placeholder="タスクを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          styles={{
            input: {
              borderColor: COLORS.LIGHT,
              '&:focus': {
                borderColor: COLORS.PRIMARY,
              },
            },
          }}
        />

        {error && (
          <Alert title="エラー" color="red" variant="light">
            {error}
          </Alert>
        )}

        {tasksLoading ? (
          <Group justify="center" py="xl">
            <Loader size="md" color={COLORS.PRIMARY} />
            <Text c={COLORS.MEDIUM}>タスクを読み込み中...</Text>
          </Group>
        ) : filteredTasks.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {searchQuery.trim() === ''
              ? '関連付け可能なタスクがありません'
              : '検索結果が見つかりません'}
          </Text>
        ) : (
          <>
            {filteredTasks.length > 0 && (
              <Group justify="space-between">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleSelectAll}
                  label={`全選択 (${selectedTaskIds.length}/${filteredTasks.length})`}
                />
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

        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            キャンセル
          </Button>
          <Button
            onClick={handleAssociate}
            loading={loading}
            disabled={selectedTaskIds.length === 0 || loading}
            color={COLORS.PRIMARY}
            leftSection={
              loading ? <Loader size={16} /> : <IconPlus size={16} />
            }
          >
            追加 ({selectedTaskIds.length})
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
