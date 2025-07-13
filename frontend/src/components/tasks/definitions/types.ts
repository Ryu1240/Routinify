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
