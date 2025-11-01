import React from 'react';
import {
  Card,
  Title,
  Text,
  Table,
  Badge,
  ActionIcon,
  Group,
  Button,
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
  onDissociateTask?: (taskId: number) => void;
  onAddTask?: () => void;
  dissociateLoading?: boolean;
};

export const MilestoneTasksTable: React.FC<MilestoneTasksTableProps> = ({
  tasks,
  onDissociateTask,
  onAddTask,
  dissociateLoading = false,
}) => {
  const handleDissociate = (taskId: number) => {
    if (window.confirm('このタスクの関連付けを解除してもよろしいですか？')) {
      onDissociateTask?.(taskId);
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={4}>関連タスク</Title>
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

      {tasks.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          関連タスクがありません
        </Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>タスク名</Table.Th>
              <Table.Th>ステータス</Table.Th>
              <Table.Th>期限日</Table.Th>
              <Table.Th>優先度</Table.Th>
              {onDissociateTask && <Table.Th>操作</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {tasks.map((task) => (
              <Table.Tr key={task.id}>
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
