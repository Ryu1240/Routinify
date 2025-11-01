import React, { useState } from 'react';
import {
  Card,
  Title,
  Text,
  Table,
  Badge,
  ActionIcon,
  Group,
  Button,
  Checkbox,
} from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import { Task } from '@/types/task';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  formatDate,
} from '@/shared/utils/taskUtils';

type MilestoneTasksTableProps = {
  tasks: Task[];
  onDissociateTask?: (taskIds: number[]) => void;
  onAddTask?: () => void;
  dissociateLoading?: boolean;
};

export const MilestoneTasksTable: React.FC<MilestoneTasksTableProps> = ({
  tasks,
  onDissociateTask,
  onAddTask,
  dissociateLoading = false,
}) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  const handleToggleTask = (taskId: number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map((task) => task.id));
    }
  };

  const handleDissociate = (taskId: number) => {
    if (window.confirm('このタスクの関連付けを解除してもよろしいですか？')) {
      onDissociateTask?.([taskId]);
    }
  };

  const handleBulkDissociate = () => {
    if (selectedTaskIds.length === 0) return;
    if (
      window.confirm(
        `${selectedTaskIds.length}件のタスクの関連付けを解除してもよろしいですか？`
      )
    ) {
      onDissociateTask?.(selectedTaskIds);
      setSelectedTaskIds([]);
    }
  };

  const allSelected =
    tasks.length > 0 && selectedTaskIds.length === tasks.length;
  const someSelected =
    selectedTaskIds.length > 0 && selectedTaskIds.length < tasks.length;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={4}>関連タスク</Title>
        <Group gap="xs">
          {onDissociateTask && selectedTaskIds.length > 0 && (
            <Button
              leftSection={<IconTrash size={16} />}
              onClick={handleBulkDissociate}
              color="red"
              variant="light"
              size="sm"
              loading={dissociateLoading}
              disabled={dissociateLoading}
            >
              選択解除 ({selectedTaskIds.length})
            </Button>
          )}
          {onAddTask && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={onAddTask}
              color={COLORS.PRIMARY}
              size="sm"
            >
              タスクを追加
            </Button>
          )}
        </Group>
      </Group>

      {tasks.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          関連タスクがありません
        </Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {onDissociateTask && (
                <Table.Th style={{ width: '40px' }}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={handleSelectAll}
                  />
                </Table.Th>
              )}
              <Table.Th>タスク名</Table.Th>
              <Table.Th>ステータス</Table.Th>
              <Table.Th>期限日</Table.Th>
              <Table.Th>優先度</Table.Th>
              {onDissociateTask && <Table.Th>操作</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {tasks.map((task) => (
              <Table.Tr
                key={task.id}
                style={{
                  backgroundColor: selectedTaskIds.includes(task.id)
                    ? COLORS.LIGHT + '20'
                    : 'transparent',
                }}
              >
                {onDissociateTask && (
                  <Table.Td>
                    <Checkbox
                      checked={selectedTaskIds.includes(task.id)}
                      onChange={() => handleToggleTask(task.id)}
                    />
                  </Table.Td>
                )}
                <Table.Td>
                  <Text fw={500}>{task.title}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={getStatusColor(task.status)} variant="light">
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
                {onDissociateTask && (
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => handleDissociate(task.id)}
                      loading={dissociateLoading}
                      disabled={dissociateLoading}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
};
