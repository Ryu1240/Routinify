import React, { useState, useMemo } from 'react';
import {
  Container,
  Title,
  Grid,
  Card,
  Text,
  Stack,
  Loader,
  Alert,
  Group,
  ActionIcon,
  Tooltip,
  Button,
  Collapse,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCheck,
  IconPlayerPlay,
  IconArrowBack,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { RoutineTaskStatsCard } from '../RoutineTaskStatsCard';
import { RoutineTaskWithStats } from '@/types/achievement';
import { Task, TaskStatus } from '@/types';
import dayjs from 'dayjs';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { AchievementBadge } from '@/features/achievements/components/AchievementBadge';

interface DashboardProps {
  routineTasks: RoutineTaskWithStats[];
  tasks: Task[];
  loading: boolean;
  error: string | null;
  onToggleTaskStatus?: (
    taskId: number,
    currentStatus: TaskStatus | null
  ) => Promise<void>;
  onSetTaskStatusToCompleted?: (taskId: number) => Promise<void>;
  onSetTaskStatusToPending?: (taskId: number) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  routineTasks,
  tasks,
  loading,
  error,
  onToggleTaskStatus,
  onSetTaskStatusToCompleted,
  onSetTaskStatusToPending,
}) => {
  const [showAllPending, setShowAllPending] = useState(false);
  const [showAllInProgress, setShowAllInProgress] = useState(false);
  const [isRoutineTasksExpanded, setIsRoutineTasksExpanded] = useState(false);
  const isMobile = useIsMobile();

  const pendingTasks = useMemo(
    () =>
      tasks.filter((task) => task.status === 'pending' || task.status === null),
    [tasks]
  );

  const inProgressTasks = useMemo(
    () => tasks.filter((task) => task.status === 'in_progress'),
    [tasks]
  );

  const displayedPendingTasks = showAllPending
    ? pendingTasks
    : pendingTasks.slice(0, 10);
  const displayedInProgressTasks = showAllInProgress
    ? inProgressTasks
    : inProgressTasks.slice(0, 10);
  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">データを読み込んでいます...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="エラー" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* 習慣化タスク達成状況セクション */}
        <div>
          {isMobile ? (
            <>
              <Title order={2} mb="md">
                習慣化タスクの達成状況
                {routineTasks.length > 0 && (
                  <Text
                    component="span"
                    size="sm"
                    c="dimmed"
                    fw={400}
                    ml="xs"
                  >
                    ({routineTasks.length}件)
                  </Text>
                )}
              </Title>
              {/* 折りたたまれた状態での簡易表示 */}
              {!isRoutineTasksExpanded && routineTasks.length > 0 && (
                <Stack gap="xs" mb="md">
                  {routineTasks.map((routineTask) => {
                    const { title, achievementStats } = routineTask;
                    const { achievementRate } = achievementStats;
                    return (
                      <Card
                        key={routineTask.id}
                        padding="sm"
                        radius="md"
                        withBorder
                        style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}
                      >
                        <Group justify="space-between" align="center">
                          <Text fw={500} size="sm" style={{ flex: 1 }}>
                            {title}
                          </Text>
                          <AchievementBadge achievementRate={achievementRate} />
                        </Group>
                      </Card>
                    );
                  })}
                  <Button
                    variant="light"
                    fullWidth
                    onClick={() => setIsRoutineTasksExpanded(true)}
                    rightSection={<IconChevronDown size={16} />}
                    mt="xs"
                  >
                    詳細を見る
                  </Button>
                </Stack>
              )}
              <Collapse in={isRoutineTasksExpanded}>
                {routineTasks.length === 0 ? (
                  <Text c="dimmed" mt="md">
                    習慣化タスクがありません
                  </Text>
                ) : (
                  <Stack gap="md">
                    <Grid>
                      {routineTasks.map((routineTask) => (
                        <Grid.Col key={routineTask.id} span={12}>
                          <RoutineTaskStatsCard routineTask={routineTask} />
                        </Grid.Col>
                      ))}
                    </Grid>
                    <Button
                      variant="subtle"
                      fullWidth
                      onClick={() => setIsRoutineTasksExpanded(false)}
                      rightSection={<IconChevronUp size={16} />}
                    >
                      折りたたむ
                    </Button>
                  </Stack>
                )}
              </Collapse>
            </>
          ) : (
            <>
              <Title order={2} mb="md">
                習慣化タスクの達成状況
              </Title>
              {routineTasks.length === 0 ? (
                <Text c="dimmed">習慣化タスクがありません</Text>
              ) : (
                <Grid>
                  {routineTasks.map((routineTask) => (
                    <Grid.Col
                      key={routineTask.id}
                      span={{ base: 12, sm: 6, md: 4 }}
                    >
                      <RoutineTaskStatsCard routineTask={routineTask} />
                    </Grid.Col>
                  ))}
                </Grid>
              )}
            </>
          )}
        </div>

        {/* 期限が近いタスク一覧セクション */}
        <div>
          <Title order={2} mb="md">
            期限が近いタスク
          </Title>
          {tasks.length === 0 ? (
            <Text c="dimmed">未完了または進行中のタスクがありません</Text>
          ) : (
            <Grid>
              {/* 未着手タスク（左側） */}
              <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 1 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Title order={3} mb="md" size="h4">
                    未着手{' '}
                    {pendingTasks.length > 0 && `(${pendingTasks.length}件)`}
                  </Title>
                  <Stack gap="sm">
                    {pendingTasks.length === 0 ? (
                      <Text c="dimmed" size="sm">
                        未着手のタスクがありません
                      </Text>
                    ) : (
                      <>
                        {displayedPendingTasks.map((task) => (
                          <Card
                            key={task.id}
                            padding="md"
                            radius="sm"
                            withBorder
                            style={{
                              borderLeft:
                                '4px solid var(--mantine-color-gray-6)',
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
                                        onClick={() =>
                                          onSetTaskStatusToCompleted(task.id)
                                        }
                                      >
                                        <IconCheck size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                  )}
                                  {onToggleTaskStatus && (
                                    <Tooltip label="進行中に変更">
                                      <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        color="blue"
                                        onClick={() =>
                                          onToggleTaskStatus(
                                            task.id,
                                            task.status
                                          )
                                        }
                                      >
                                        <IconPlayerPlay size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                  )}
                                </Group>
                              </Group>
                              <Group gap="md">
                                {task.dueDate && (
                                  <Text size="sm" c="dimmed">
                                    期限:{' '}
                                    {dayjs(task.dueDate).format(
                                      'YYYY年MM月DD日'
                                    )}
                                  </Text>
                                )}
                                {!task.dueDate && (
                                  <Text size="sm" c="dimmed">
                                    期限: なし
                                  </Text>
                                )}
                              </Group>
                            </Stack>
                          </Card>
                        ))}
                        {pendingTasks.length > 10 && (
                          <Button
                            variant="subtle"
                            size="sm"
                            fullWidth
                            onClick={() => setShowAllPending(!showAllPending)}
                            rightSection={
                              showAllPending ? (
                                <IconChevronUp size={16} />
                              ) : (
                                <IconChevronDown size={16} />
                              )
                            }
                          >
                            {showAllPending
                              ? '折りたたむ'
                              : `もっと見る (残り${pendingTasks.length - 10}件)`}
                          </Button>
                        )}
                      </>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>

              {/* 進行中タスク（右側） */}
              <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Title order={3} mb="md" size="h4">
                    進行中{' '}
                    {inProgressTasks.length > 0 &&
                      `(${inProgressTasks.length}件)`}
                  </Title>
                  <Stack gap="sm">
                    {inProgressTasks.length === 0 ? (
                      <Text c="dimmed" size="sm">
                        進行中のタスクがありません
                      </Text>
                    ) : (
                      <>
                        {displayedInProgressTasks.map((task) => (
                          <Card
                            key={task.id}
                            padding="md"
                            radius="sm"
                            withBorder
                            style={{
                              borderLeft:
                                '4px solid var(--mantine-color-blue-6)',
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
                                        onClick={() =>
                                          onSetTaskStatusToCompleted(task.id)
                                        }
                                      >
                                        <IconCheck size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                  )}
                                  {onSetTaskStatusToPending && (
                                    <Tooltip label="未着手に戻す">
                                      <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        color="gray"
                                        onClick={() =>
                                          onSetTaskStatusToPending(task.id)
                                        }
                                      >
                                        <IconArrowBack size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                  )}
                                </Group>
                              </Group>
                              <Group gap="md">
                                {task.dueDate && (
                                  <Text size="sm" c="dimmed">
                                    期限:{' '}
                                    {dayjs(task.dueDate).format(
                                      'YYYY年MM月DD日'
                                    )}
                                  </Text>
                                )}
                                {!task.dueDate && (
                                  <Text size="sm" c="dimmed">
                                    期限: なし
                                  </Text>
                                )}
                              </Group>
                            </Stack>
                          </Card>
                        ))}
                        {inProgressTasks.length > 10 && (
                          <Button
                            variant="subtle"
                            size="sm"
                            fullWidth
                            onClick={() =>
                              setShowAllInProgress(!showAllInProgress)
                            }
                            rightSection={
                              showAllInProgress ? (
                                <IconChevronUp size={16} />
                              ) : (
                                <IconChevronDown size={16} />
                              )
                            }
                          >
                            {showAllInProgress
                              ? '折りたたむ'
                              : `もっと見る (残り${inProgressTasks.length - 10}件)`}
                          </Button>
                        )}
                      </>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          )}
        </div>
      </Stack>
    </Container>
  );
};
