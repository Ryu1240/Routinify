import React from 'react';
import {
  Container,
  Title,
  Text,
  Badge,
  Group,
  Progress,
  Card,
  Stack,
  Button,
  Table,
  ActionIcon,
} from '@mantine/core';
import { IconEdit, IconTrash, IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '@/shared/constants/colors';
import { Milestone, MILESTONE_STATUS_LABELS } from '@/types/milestone';
import { Task } from '@/types/task';
import {
  getStatusColor,
  formatDate,
} from '@/features/milestones/components/MilestoneList/utils/utils';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor as getTaskStatusColor,
  getStatusLabel,
} from '@/shared/utils/taskUtils';

type MilestoneDetailProps = {
  milestone: Milestone;
  onEdit?: () => void;
  onDelete?: () => void;
};

export const MilestoneDetail: React.FC<MilestoneDetailProps> = ({
  milestone,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  const tasks = milestone.tasks || [];

  return (
    <Container size="xl" py="xl">
      <Group mb="lg">
        <ActionIcon
          variant="subtle"
          color={COLORS.PRIMARY}
          onClick={() => navigate('/milestones')}
        >
          <IconArrowLeft size={20} />
        </ActionIcon>
        <Title order={2}>マイルストーン詳細</Title>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
        <Group justify="space-between" mb="md">
          <Group>
            <Title order={3}>{milestone.name}</Title>
            <Badge color={getStatusColor(milestone.status)} variant="light">
              {MILESTONE_STATUS_LABELS[milestone.status]}
            </Badge>
          </Group>
          <Group gap="xs">
            {onEdit && (
              <Button
                leftSection={<IconEdit size={16} />}
                variant="light"
                color={COLORS.PRIMARY}
                onClick={onEdit}
              >
                編集
              </Button>
            )}
            {onDelete && (
              <Button
                leftSection={<IconTrash size={16} />}
                variant="light"
                color="red"
                onClick={onDelete}
              >
                削除
              </Button>
            )}
          </Group>
        </Group>

        {milestone.description && (
          <Text size="md" c="dimmed" mb="md">
            {milestone.description}
          </Text>
        )}

        <Stack gap="md">
          <Group>
            <Text size="sm">
              <Text span fw={500}>
                開始日:
              </Text>{' '}
              {formatDate(milestone.startDate)}
            </Text>
            <Text size="sm">
              <Text span fw={500}>
                期限日:
              </Text>{' '}
              {formatDate(milestone.dueDate)}
            </Text>
            <Text size="sm">
              <Text span fw={500}>
                タスク:
              </Text>{' '}
              {milestone.completedTasksCount}/{milestone.totalTasksCount} 完了
            </Text>
          </Group>

          <Group gap="xs" align="center">
            <Progress
              value={milestone.progressPercentage}
              size="lg"
              radius="xl"
              color={
                milestone.progressPercentage === 100 ? 'green' : COLORS.PRIMARY
              }
              style={{ flex: 1 }}
            />
            <Text size="sm" fw={500} c="dimmed">
              {milestone.progressPercentage}%
            </Text>
          </Group>
        </Stack>
      </Card>

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
              {tasks.map((task: Task) => (
                <Table.Tr key={task.id}>
                  <Table.Td>
                    <Text fw={500}>{task.title}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={getTaskStatusColor(task.status)}
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
        )}
      </Card>
    </Container>
  );
};
