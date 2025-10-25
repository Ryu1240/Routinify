// 習慣化タスク関連の型定義

export type RoutineTask = {
  readonly id: number;
  readonly accountId: string;
  title: string;
  frequency: RoutineTaskFrequency;
  intervalValue: number | null;
  lastGeneratedAt: string | null;
  nextGenerationAt: string;
  maxActiveTasks: number;
  categoryId: number | null;
  categoryName: string | null;
  priority: RoutineTaskPriority | null;
  isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type RoutineTaskFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type RoutineTaskPriority = 'low' | 'medium' | 'high';

// DTO型（Data Transfer Object）
export type CreateRoutineTaskDto = Omit<
  RoutineTask,
  | 'id'
  | 'accountId'
  | 'categoryName'
  | 'lastGeneratedAt'
  | 'createdAt'
  | 'updatedAt'
>;
export type UpdateRoutineTaskDto = Partial<CreateRoutineTaskDto>;

// ユーティリティ型
export type RoutineTaskKeys = keyof RoutineTask;

// 定数
export const ROUTINE_TASK_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
} as const;

export const ROUTINE_TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;
