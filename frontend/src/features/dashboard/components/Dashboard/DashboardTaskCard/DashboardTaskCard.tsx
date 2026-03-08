import React from 'react';
import { Card, Text, Stack, Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconCheck, IconPlayerPlay, IconArrowBack } from '@tabler/icons-react';
import { Task, TaskStatus } from '@/types';
import dayjs from 'dayjs';

type DashboardTaskCardProps = {
  task: Task;
  borderColor: string;
  onSetTaskStatusToCompleted?: (taskId: number) => Promise<void>;
  onToggleTaskStatus?: (
    taskId: number,
    currentStatus: TaskStatus | null
  ) => Promise<void>;
  onSetTaskStatusToPending?: (taskId: number) => Promise<void>;
};

export const DashboardTaskCard: React.FC<DashboardTaskCardProps> = ({
  task,
  borderColor,
  onSetTaskStatusToCompleted,
  onToggleTaskStatus,
  onSetTaskStatusToPending,
}) => {
  const isPending = task.status === 'pending' || task.status === null;
  return (
    <Card
      padding="md"
      radius="sm"
      withBorder
      style={{
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <Text fw={600} style={{ flex: 1 }}>
            {task.title}
          </Text>
          <Group gap="xs">
            {onSetTaskStatusToCompleted && (
              <Tooltip label="完了に変更">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="green"
                  onClick={() => onSetTaskStatusToCompleted(task.id)}
                >
                  <IconCheck size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {isPending && onToggleTaskStatus && (
              <Tooltip label="進行中に変更">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="blue"
                  onClick={() => onToggleTaskStatus(task.id, task.status)}
                >
                  <IconPlayerPlay size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {!isPending && onSetTaskStatusToPending && (
              <Tooltip label="未着手に戻す">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => onSetTaskStatusToPending(task.id)}
                >
                  <IconArrowBack size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
        <Group gap="md">
          {task.dueDate ? (
            <Text size="sm" c="dimmed">
              期限: {dayjs(task.dueDate).format('YYYY年MM月DD日')}
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              期限: なし
            </Text>
          )}
        </Group>
      </Stack>
    </Card>
  );
};
