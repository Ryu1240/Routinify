// マイルストーン関連の型定義

export type MilestoneStatus = 'planning' | 'in_progress' | 'completed' | 'cancelled';

export type Milestone = {
  readonly id: number;
  readonly accountId: string;
  name: string;
  description?: string | null;
  startDate: string | null;
  dueDate: string | null;
  status: MilestoneStatus;
  completedAt: string | null;
  progressPercentage: number;
  totalTasksCount: number;
  completedTasksCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

// フィルタリング・ソート用の型
export type MilestoneFilters = {
  status?: MilestoneStatus;
  dueDateRange?: 'overdue' | 'today' | 'this_week' | 'this_month';
  search?: string;
  sortBy?: 'created_at' | 'due_date' | 'progress';
  sortOrder?: 'asc' | 'desc';
};

// 定数
export const MILESTONE_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  planning: '計画中',
  in_progress: '進行中',
  completed: '完了',
  cancelled: 'キャンセル',
};

export const DUE_DATE_RANGE_LABELS: Record<
  'overdue' | 'today' | 'this_week' | 'this_month',
  string
> = {
  overdue: '期限切れ',
  today: '今日',
  this_week: '今週',
  this_month: '今月',
};

