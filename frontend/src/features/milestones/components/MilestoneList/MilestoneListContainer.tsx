import React, { useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useFetchMilestones } from '../../hooks';
import { useMilestoneMutations } from '../../hooks/useMilestoneMutations';
import {
  MilestoneFilters,
  CreateMilestoneDto,
  UpdateMilestoneDto,
  Milestone,
} from '@/types/milestone';
import { MilestoneList } from './MilestoneList';
import { MilestoneFormModal } from '@/features/milestones/components/MilestoneFormModal/MilestoneFormModal';
import { DeleteMilestoneConfirmModal } from '@/features/milestones/components/DeleteMilestoneConfirmModal';
import { milestonesApi } from '../../api/milestonesApi';

export const MilestoneListContainer: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [filters, setFilters] = React.useState<MilestoneFilters>({
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(
    null
  );
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<number | null>(
    null
  );
  const [deletingMilestoneName, setDeletingMilestoneName] = useState<
    string | null
  >(null);
  const { milestones, loading, error, fetchMilestones } = useFetchMilestones();
  const {
    createMilestone,
    createLoading,
    updateMilestone,
    updateLoading,
    deleteMilestone,
    deleteLoading,
  } = useMilestoneMutations(() => {
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
    setIsEditMode(false);
    setEditingMilestoneId(null);
    setEditingMilestone(null);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (milestoneData: CreateMilestoneDto) => {
    await createMilestone(milestoneData);
    setIsModalOpen(false);
  };

  const handleEdit = async (milestoneId: number) => {
    try {
      const milestone = await milestonesApi.getById(milestoneId);
      setEditingMilestone(milestone);
      setEditingMilestoneId(milestoneId);
      setIsEditMode(true);
      setIsModalOpen(true);
    } catch (error) {
      console.error('マイルストーンの更新に失敗しました:', error);
    }
  };

  const handleEditSubmit = async (milestoneData: UpdateMilestoneDto) => {
    if (!editingMilestoneId) return;
    await updateMilestone(editingMilestoneId, milestoneData);
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingMilestoneId(null);
    setEditingMilestone(null);
  };

  const handleDelete = async (milestoneId: number) => {
    try {
      const milestone = await milestonesApi.getById(milestoneId);
      setDeletingMilestoneId(milestoneId);
      setDeletingMilestoneName(milestone.name);
      setIsDeleteModalOpen(true);
    } catch (error) {
      console.error('マイルストーンの削除に失敗しました:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMilestoneId) return;
    await deleteMilestone(deletingMilestoneId);
    setIsDeleteModalOpen(false);
    setDeletingMilestoneId(null);
    setDeletingMilestoneName(null);
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setDeletingMilestoneId(null);
    setDeletingMilestoneName(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingMilestoneId(null);
    setEditingMilestone(null);
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
      <MilestoneFormModal
        key={
          isEditMode && editingMilestone
            ? `edit-${editingMilestone.id}`
            : `create-${isModalOpen}`
        }
        opened={isModalOpen}
        onClose={handleModalClose}
        onCreate={handleCreateSubmit}
        onUpdate={handleEditSubmit}
        loading={isEditMode ? updateLoading : createLoading}
        initialData={editingMilestone || undefined}
        mode={isEditMode ? 'edit' : 'create'}
      />
      <DeleteMilestoneConfirmModal
        opened={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteConfirm}
        milestoneName={deletingMilestoneName || undefined}
        loading={deleteLoading}
      />
    </>
  );
};
