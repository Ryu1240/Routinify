import { Task, UpdateTaskDto } from '../../../types';

export type TaskColumn = {
  key: keyof Task;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (task: Task) => React.ReactNode;
};

export type TaskTableProps = {
  tasks: Task[];
  sortBy: string | null;
  reverseSortDirection: boolean;
  onSort: (key: string) => void;
  editingTaskId: number | null;
  onEdit: (taskId: number) => void;
  onSave: (taskId: number, taskData: UpdateTaskDto) => Promise<void>;
  onCancel: () => void;
  onDelete: (taskId: number) => void;
};
