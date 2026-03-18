import React, { useState } from 'react';
import {
  Title,
  Grid,
  Card,
  Text,
  Stack,
  Group,
  Button,
  Collapse,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { ListPageState } from '@/shared/components';
import { RoutineTaskStatsCard } from '../RoutineTaskStatsCard';
import { RoutineTaskWithStats } from '@/types/achievement';
import { Task, TaskStatus } from '@/types';
import { Milestone } from '@/types/milestone';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { AchievementBadge } from '@/features/achievements/components/AchievementBadge';
import { DueSoonTasksSection } from './DueSoonTasksSection';

interface DashboardProps {
  routineTasks: RoutineTaskWithStats[];
  tasks: Task[];
  milestones: Milestone[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void | Promise<void>;
  onToggleTaskStatus?: (
    taskId: number,
    currentStatus: TaskStatus | null
  ) => Promise<void>;
  onSetTaskStatusToCompleted?: (taskId: number) => Promise<void>;
  onSetTaskStatusToPending?: (taskId: number) => Promise<void>;
  onDeleteTask?: (taskId: number) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  routineTasks,
  tasks,
  milestones,
  loading,
  error,
  onRetry,
  onToggleTaskStatus,
  onSetTaskStatusToCompleted,
  onSetTaskStatusToPending,
  onDeleteTask,
}) => {
  const [isRoutineTasksExpanded, setIsRoutineTasksExpanded] = useState(false);
  const isMobile = useIsMobile();
  if (loading) {
    return (
      <ListPageState
        variant="loading"
        loadingMessage="データを読み込んでいます..."
      />
    );
  }

  if (error) {
    return (
      <ListPageState variant="error" errorMessage={error} onRetry={onRetry} />
    );
  }

  return (
    <Stack gap="xl">
      {/* 習慣化タスク達成状況セクション */}
      <div>
        {isMobile ? (
          <>
            <Title order={2} mb="md">
              習慣化タスクの達成状況
              {routineTasks.length > 0 && (
                <Text component="span" size="sm" c="dimmed" fw={400} ml="xs">
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
                      style={{
                        backgroundColor: 'var(--mantine-color-gray-0)',
                      }}
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
      <DueSoonTasksSection
        tasks={tasks}
        milestones={milestones}
        onSetTaskStatusToCompleted={onSetTaskStatusToCompleted}
        onToggleTaskStatus={onToggleTaskStatus}
        onSetTaskStatusToPending={onSetTaskStatusToPending}
        onDeleteTask={onDeleteTask}
      />
    </Stack>
  );
};
