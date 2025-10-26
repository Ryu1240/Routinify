import React from 'react';
import {
  Box,
  Button,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Stack,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { RoutineTask } from '@/types';

interface RoutineTaskListProps {
  routineTasks: RoutineTask[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
}

const getFrequencyLabel = (frequency: string): string => {
  switch (frequency) {
    case 'daily':
      return '毎日';
    case 'weekly':
      return '毎週';
    case 'monthly':
      return '毎月';
    case 'custom':
      return 'カスタム';
    default:
      return frequency;
  }
};

const getPriorityColor = (
  priority: string | null
): 'blue' | 'yellow' | 'red' | 'gray' => {
  switch (priority) {
    case 'high':
      return 'red';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'blue';
    default:
      return 'gray';
  }
};

const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return '未生成';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
};

export const RoutineTaskList: React.FC<RoutineTaskListProps> = ({
  routineTasks,
  loading,
  error,
  onDelete,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box p="md">
        <Text>読み込み中...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p="md">
        <Text c="red">{error}</Text>
      </Box>
    );
  }

  return (
    <Box p="md">
      <Group justify="space-between" mb="md">
        <Title order={2}>習慣化タスク</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate('/routine-tasks/new')}
        >
          新規作成
        </Button>
      </Group>

      {routineTasks.length === 0 ? (
        <Text c="dimmed">習慣化タスクがありません</Text>
      ) : (
        <Box>
          {routineTasks.map((task) => (
            <Card
              key={task.id}
              shadow="sm"
              p="md"
              mb="sm"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/routine-tasks/${task.id}`)}
            >
              <Group justify="space-between" align="flex-start">
                <Box style={{ flex: 1 }}>
                  <Group gap="xs" mb="xs">
                    <Text fw={500}>{task.title}</Text>
                    {!task.isActive && <Badge color="gray">無効</Badge>}
                    {task.priority && (
                      <Badge color={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    )}
                  </Group>
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">
                      頻度: {getFrequencyLabel(task.frequency)}
                      {task.frequency === 'custom' &&
                        task.intervalValue &&
                        ` (${task.intervalValue}日ごと)`}
                    </Text>
                    {task.categoryName && (
                      <Text size="sm" c="dimmed">
                        カテゴリ: {task.categoryName}
                      </Text>
                    )}
                    <Text size="sm" c="dimmed">
                      最終生成: {formatDateTime(task.lastGeneratedAt)}
                    </Text>
                    <Text size="sm" c="dimmed">
                      次回生成: {formatDateTime(task.nextGenerationAt)}
                    </Text>
                    <Text size="sm" c="dimmed">
                      上限数: {task.maxActiveTasks}個
                    </Text>
                  </Stack>
                </Box>
                <Button
                  color="red"
                  variant="light"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        'この習慣化タスクを削除してもよろしいですか？'
                      )
                    ) {
                      onDelete(task.id);
                    }
                  }}
                >
                  削除
                </Button>
              </Group>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};
