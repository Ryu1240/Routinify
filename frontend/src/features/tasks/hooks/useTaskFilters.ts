import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types';

export const useTaskFilters = (tasks: Task[]) => {
  const [search, setSearch] = useState('');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  const filterTasks = useCallback(() => {
    const filtered = tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.status &&
          task.status.toLowerCase().includes(search.toLowerCase()))
    );
    setFilteredTasks(filtered);
  }, [tasks, search]);

  useEffect(() => {
    filterTasks();
  }, [filterTasks]);

  return {
    search,
    setSearch,
    filteredTasks,
  };
};
