export interface Task {
  id: number;
  accountId?: string;
  title: string;
  description?: string;
  category?: string | null;
  status?: string | null;
  priority?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type TaskStatus   = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low'     | 'medium'      | 'high';  

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
  onEdit: (taskId: number) => void;
  onDelete: (taskId: number) => void;
}

export interface CreateTaskData {
  title: string;
  dueDate?: string | null;
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  category?: string | null;
}
