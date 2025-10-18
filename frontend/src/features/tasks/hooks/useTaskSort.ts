import { useState, useEffect, useCallback } from 'react';
import { Task } from '../../../types';

export const useTaskSort = (tasks: Task[]) => {
  const [sortBy, setSortBy] = useState<keyof Task | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [sortedTasks, setSortedTasks] = useState<Task[]>(tasks);

  const sortTasks = useCallback(() => {
    if (!sortBy) {
      setSortedTasks(tasks);
      return;
    }

    const sorted = [...tasks].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return reverseSortDirection ? -comparison : comparison;
    });

    setSortedTasks(sorted);
  }, [tasks, sortBy, reverseSortDirection]);

  useEffect(() => {
    sortTasks();
  }, [sortTasks]);

  const setSorting = (field: keyof Task) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
  };

  return {
    sortBy,
    reverseSortDirection,
    sortedTasks,
    setSorting,
  };
};
