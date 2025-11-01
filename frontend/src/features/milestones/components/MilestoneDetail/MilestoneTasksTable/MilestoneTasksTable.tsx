import React from 'react';
import { Card, Title, Text, Table, Badge } from '@mantine/core';
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
};

export const MilestoneTasksTable: React.FC<MilestoneTasksTableProps> = ({
  tasks,
}) => {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={4} mb="md">
        関連タスク
      </Title>

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
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
};
