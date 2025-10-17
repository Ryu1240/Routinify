export interface Task {
  id: number;
  accountId?: string;
  title: string;
  description?: string;
  categoryId?: number | null;
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskColumn {
  key: keyof Task;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (task: Task) => React.ReactNode;
}

export interface TaskTableProps {
  tasks: Task[];
  sortBy: string | null;
  reverseSortDirection: boolean;
  onSort: (key: string) => void;
  editingTaskId: number | null;
  onEdit: (taskId: number) => void;
  onSave: (taskId: number, taskData: UpdateTaskData) => Promise<void>;
  onCancel: () => void;
  onDelete: (taskId: number) => void;
}

export interface CreateTaskData {
  title: string;
  dueDate?: string | null;
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  categoryId?: number | null;
}

export interface UpdateTaskData {
  title: string;
  dueDate?: string | null;
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  categoryId?: number | null;
}
