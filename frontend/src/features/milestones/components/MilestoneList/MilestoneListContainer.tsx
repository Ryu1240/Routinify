import React, { useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useFetchMilestones } from '../../hooks';
import { useMilestoneMutations } from '../../hooks/useMilestoneMutations';
import { MilestoneFilters, CreateMilestoneDto } from '@/types/milestone';
import { MilestoneList } from './MilestoneList';
import { MilestoneForm } from '@/features/milestones/components/MilestoneForm';

export const MilestoneListContainer: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [filters, setFilters] = React.useState<MilestoneFilters>({
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { milestones, loading, error, fetchMilestones } = useFetchMilestones();
  const { createMilestone, createLoading } = useMilestoneMutations(() => {
    fetchMilestones(filters);
  });

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

  const handleCreate = () => {
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (milestoneData: CreateMilestoneDto) => {
    await createMilestone(milestoneData);
    setIsModalOpen(false);
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
    <>
      <MilestoneList
        isAuthenticated={isAuthenticated}
        authLoading={authLoading}
        milestones={milestones}
        filters={filters}
        onFilterChange={handleFilterChange}
        loading={loading}
        error={error}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <MilestoneForm
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateSubmit}
        loading={createLoading}
      />
    </>
  );
};
