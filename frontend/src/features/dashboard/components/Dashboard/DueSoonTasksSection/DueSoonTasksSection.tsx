import React, { useMemo } from 'react';
import { Title, Grid, Text, Group } from '@mantine/core';
import { Task } from '@/types';
import { Milestone } from '@/types/milestone';
import { DashboardTasksColumn } from '../DashboardTasksColumn';
import { TaskStatus } from '@/types';
import { AddTaskButton } from '@/features/tasks/components/AddTaskButton';

type MilestoneWithTasks = {
  milestone: Milestone;
  tasks: Task[];
};

type DueSoonTasksSectionProps = {
  tasks: Task[];
  milestones: Milestone[];
  onAddTask?: () => void;
  onSetTaskStatusToCompleted?: (taskId: number) => Promise<void>;
  onToggleTaskStatus?: (
    taskId: number,
    currentStatus: TaskStatus | null
  ) => Promise<void>;
  onSetTaskStatusToPending?: (taskId: number) => Promise<void>;
  onDeleteTask?: (taskId: number) => Promise<void>;
};

export const DueSoonTasksSection: React.FC<DueSoonTasksSectionProps> = ({
  tasks,
  milestones,
  onAddTask,
  onSetTaskStatusToCompleted,
  onToggleTaskStatus,
  onSetTaskStatusToPending,
  onDeleteTask,
}) => {
  const {
    standalonePendingTasks,
    standaloneInProgressTasks,
    milestonesInPendingColumn,
    milestonesInInProgressColumn,
    hasAnyTasks,
  } = useMemo(() => {
    const pendingTasks = tasks.filter(
      (t) => t.status === 'pending' || t.status === null
    );
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');

    const hasMilestoneIds = (task: Task) =>
      task.milestoneIds && task.milestoneIds.length > 0;

    const standalonePending = pendingTasks.filter((t) => !hasMilestoneIds(t));
    const standaloneInProgress = inProgressTasks.filter(
      (t) => !hasMilestoneIds(t)
    );

    const milestonesInPending: MilestoneWithTasks[] = [];
    const milestonesInProgress: MilestoneWithTasks[] = [];

    for (const milestone of milestones) {
      const tasksInMilestone = tasks.filter((t) =>
        t.milestoneIds?.includes(milestone.id)
      );
      const pendingInMs = tasksInMilestone.filter(
        (t) => t.status === 'pending' || t.status === null
      );
      const inProgressInMs = tasksInMilestone.filter(
        (t) => t.status === 'in_progress'
      );

      if (inProgressInMs.length > 0) {
        // 進行中タスクがある場合 → 進行中カラム（pending + in_progress を内包）
        milestonesInProgress.push({
          milestone,
          tasks: [...pendingInMs, ...inProgressInMs].sort((a, b) => {
            const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            return aDate - bDate;
          }),
        });
      } else if (pendingInMs.length > 0) {
        // 進行中タスクがなく、pending のみの場合
        // 完了と未着手が混在（completedTasksCount > 0）→ 進行中カラム扱い
        // 未着手のみ（completedTasksCount === 0）→ 未着手カラム
        const hasCompletedTasks = milestone.completedTasksCount > 0;
        const sortedPending = pendingInMs.sort((a, b) => {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return aDate - bDate;
        });
        if (hasCompletedTasks) {
          milestonesInProgress.push({ milestone, tasks: sortedPending });
        } else {
          milestonesInPending.push({ milestone, tasks: sortedPending });
        }
      }
    }

    milestonesInProgress.sort((a, b) => {
      const aMin = Math.min(
        ...a.tasks.map((t) =>
          t.dueDate ? new Date(t.dueDate).getTime() : Infinity
        )
      );
      const bMin = Math.min(
        ...b.tasks.map((t) =>
          t.dueDate ? new Date(t.dueDate).getTime() : Infinity
        )
      );
      return aMin - bMin;
    });

    milestonesInPending.sort((a, b) => {
      const aMin = Math.min(
        ...a.tasks.map((t) =>
          t.dueDate ? new Date(t.dueDate).getTime() : Infinity
        )
      );
      const bMin = Math.min(
        ...b.tasks.map((t) =>
          t.dueDate ? new Date(t.dueDate).getTime() : Infinity
        )
      );
      return aMin - bMin;
    });

    return {
      standalonePendingTasks: standalonePending,
      standaloneInProgressTasks: standaloneInProgress,
      milestonesInPendingColumn: milestonesInPending,
      milestonesInInProgressColumn: milestonesInProgress,
      hasAnyTasks:
        standalonePending.length > 0 ||
        standaloneInProgress.length > 0 ||
        milestonesInPending.length > 0 ||
        milestonesInProgress.length > 0,
    };
  }, [tasks, milestones]);

  return (
    <div>
      <Group justify="space-between" align="center" mb="md">
        <Title order={2}>期限が近いタスク</Title>
        {onAddTask && <AddTaskButton onClick={onAddTask} />}
      </Group>
      {!hasAnyTasks ? (
        <Text c="dimmed">未完了または進行中のタスクがありません</Text>
      ) : (
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 1 }}>
            <DashboardTasksColumn
              title="未着手"
              tasks={standalonePendingTasks}
              milestonesWithTasks={milestonesInPendingColumn}
              taskStatus="pending"
              borderColor="var(--mantine-color-gray-6)"
              onSetTaskStatusToCompleted={onSetTaskStatusToCompleted}
              onToggleTaskStatus={onToggleTaskStatus}
              onSetTaskStatusToPending={onSetTaskStatusToPending}
              onDeleteTask={onDeleteTask}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
            <DashboardTasksColumn
              title="進行中"
              tasks={standaloneInProgressTasks}
              milestonesWithTasks={milestonesInInProgressColumn}
              taskStatus="in_progress"
              borderColor="var(--mantine-color-blue-6)"
              onSetTaskStatusToCompleted={onSetTaskStatusToCompleted}
              onToggleTaskStatus={onToggleTaskStatus}
              onSetTaskStatusToPending={onSetTaskStatusToPending}
              onDeleteTask={onDeleteTask}
            />
          </Grid.Col>
        </Grid>
      )}
    </div>
  );
};
