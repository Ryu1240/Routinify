import { Task } from './types';

// タスクのソート関数
export const sortTasks = (tasks: Task[], sortKey: keyof Task, sortOrder: 'asc' | 'desc'): Task[] => {
  return [...tasks].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    let comparison = 0;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue, 'ja');
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else {
      comparison = String(aValue).localeCompare(String(bValue), 'ja');
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

// タスクのフィルタリング関数
export const filterTasks = (tasks: Task[], searchTerm: string): Task[] => {
  if (!searchTerm.trim()) return tasks;

  const term = searchTerm.toLowerCase();
  return tasks.filter(task => 
    task.title.toLowerCase().includes(term) ||
    (task.description && task.description.toLowerCase().includes(term)) ||
    (task.status && task.status.toLowerCase().includes(term)) ||
    (task.priority && task.priority.toLowerCase().includes(term))
  );
};

// タスクのステータス別カウント
export const getTaskCounts = (tasks: Task[]) => {
  return {
    total: tasks.length,
    pending: tasks.filter(task => task.status === 'pending').length,
    inProgress: tasks.filter(task => task.status === 'in_progress').length,
    completed: tasks.filter(task => task.status === 'completed').length
  };
};

// タスクの優先度別カウント
export const getPriorityCounts = (tasks: Task[]) => {
  return {
    low: tasks.filter(task => task.priority === 'low').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    high: tasks.filter(task => task.priority === 'high').length
  };
}; 