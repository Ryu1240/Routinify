// タスク関連の型定義

export type Task = {
  readonly id: number;
  accountId: string;
  title: string;
  description?: string;
  categoryId: number | null;
  status: TaskStatus | null;
  priority: TaskPriority | null;
  dueDate: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

// DTO型（Data Transfer Object）
export type CreateTaskDto = Omit<
  Task,
  'id' | 'accountId' | 'createdAt' | 'updatedAt'
>;
export type UpdateTaskDto = Partial<CreateTaskDto>;

// ユーティリティ型
export type TaskKeys = keyof Task;
export type TaskSortKey = Extract<
  TaskKeys,
  'createdAt' | 'dueDate' | 'priority'
>;

// 定数
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;
