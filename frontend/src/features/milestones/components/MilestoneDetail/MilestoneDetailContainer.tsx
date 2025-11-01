import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Loader, Alert, Text, Group } from '@mantine/core';
import { COLORS } from '@/shared/constants/colors';
import { useAuth } from '@/shared/hooks/useAuth';
import { useFetchMilestone } from '../../hooks/useFetchMilestone';
import { useMilestoneMutations } from '../../hooks/useMilestoneMutations';
import { UpdateMilestoneDto } from '@/types/milestone';
import { MilestoneDetail } from './MilestoneDetail';
import { DeleteMilestoneConfirmModal } from '@/features/milestones/components/DeleteMilestoneConfirmModal';

export const MilestoneDetailContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const milestoneId = id ? parseInt(id, 10) : null;
  const { milestone, loading, error, refreshMilestone } =
    useFetchMilestone(milestoneId);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { updateMilestone, updateLoading, deleteMilestone, deleteLoading } =
    useMilestoneMutations(() => {
      if (milestoneId) {
        refreshMilestone();
      }
    });

  const handleEdit = async (milestoneData: UpdateMilestoneDto) => {
    if (!milestoneId) return;
    await updateMilestone(milestoneId, milestoneData);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!milestoneId) return;
    await deleteMilestone(milestoneId);
    setIsDeleteModalOpen(false);
    // 削除後は一覧ページにリダイレクト
    navigate('/milestones');
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
  };

  if (authLoading || loading) {
    return (
      <Container size="xl" py="xl">
        <Group justify="center">
          <Loader size="lg" color={COLORS.PRIMARY} />
          <Text c={COLORS.MEDIUM}>
            {authLoading
              ? '認証情報を確認中...'
              : 'マイルストーンを読み込み中...'}
          </Text>
        </Group>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container size="xl" py="xl">
        <Alert title="認証が必要" color={COLORS.PRIMARY} variant="light">
          マイルストーン詳細を表示するにはログインが必要です。
        </Alert>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert title="エラー" color="red" variant="light">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!milestone) {
    return (
      <Container size="xl" py="xl">
        <Alert
          title="マイルストーンが見つかりません"
          color="red"
          variant="light"
        >
          指定されたマイルストーンは存在しないか、アクセス権限がありません。
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <MilestoneDetail
        milestone={milestone}
        onEdit={handleEdit}
        onDelete={handleDelete}
        editLoading={updateLoading}
      />
      <DeleteMilestoneConfirmModal
        opened={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteConfirm}
        milestoneName={milestone.name}
        loading={deleteLoading}
      />
    </>
  );
};
