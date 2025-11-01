import { useState, useCallback, useMemo } from 'react';
import { Milestone, MilestoneFilters } from '@/types/milestone';

export const useMilestoneFilters = (milestones: Milestone[]) => {
  const [filters, setFilters] = useState<MilestoneFilters>({
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const updateFilter = useCallback((key: keyof MilestoneFilters, value: MilestoneFilters[keyof MilestoneFilters]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  }, []);

  const filteredMilestones = useMemo(() => {
    let filtered = [...milestones];

    // ステータスフィルタ
    if (filters.status) {
      filtered = filtered.filter((m) => m.status === filters.status);
    }

    // 期限範囲フィルタ（フロントエンド側でも簡易的にフィルタリング）
    if (filters.dueDateRange) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      filtered = filtered.filter((m) => {
        if (!m.dueDate) return false;
        const dueDate = new Date(m.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        switch (filters.dueDateRange) {
          case 'overdue':
            return dueDate < today;
          case 'today':
            return dueDate.getTime() === today.getTime();
          case 'this_week':
            return dueDate >= today && dueDate <= endOfWeek;
          case 'this_month':
            return dueDate >= today && dueDate <= endOfMonth;
          default:
            return true;
        }
      });
    }

    // 検索フィルタ
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(searchLower) ||
          (m.description && m.description.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [milestones, filters]);

  const sortedMilestones = useMemo(() => {
    const sorted = [...filteredMilestones];

    if (filters.sortBy) {
      sorted.sort((a, b) => {
        let aValue: number;
        let bValue: number;

        switch (filters.sortBy) {
          case 'created_at':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'due_date':
            aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
            bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
            break;
          case 'progress':
            aValue = a.progressPercentage;
            bValue = b.progressPercentage;
            break;
          default:
            return 0;
        }

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return sorted;
  }, [filteredMilestones, filters.sortBy, filters.sortOrder]);

  return {
    filters,
    updateFilter,
    clearFilters,
    filteredMilestones: sortedMilestones,
  };
};

