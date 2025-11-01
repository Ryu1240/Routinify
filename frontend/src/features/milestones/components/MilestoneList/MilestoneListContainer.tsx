import React from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useFetchMilestones } from '../../hooks';
import { MilestoneFilters } from '@/types/milestone';
import { MilestoneList } from './MilestoneList';

export const MilestoneListContainer: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [filters, setFilters] = React.useState<MilestoneFilters>({
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const { milestones, loading, error, fetchMilestones } = useFetchMilestones();

  React.useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    fetchMilestones(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, filters]);

  const handleFilterChange = (
    key: keyof MilestoneFilters,
    value: MilestoneFilters[keyof MilestoneFilters]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEdit = (milestoneId: number) => {
    // TODO: 編集機能の実装
    console.log('Edit milestone:', milestoneId);
  };

  const handleDelete = (milestoneId: number) => {
    // TODO: 削除機能の実装
    if (window.confirm('このマイルストーンを削除してもよろしいですか？')) {
      console.log('Delete milestone:', milestoneId);
    }
  };

  return (
    <MilestoneList
      isAuthenticated={isAuthenticated}
      authLoading={authLoading}
      milestones={milestones}
      filters={filters}
      onFilterChange={handleFilterChange}
      loading={loading}
      error={error}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};
