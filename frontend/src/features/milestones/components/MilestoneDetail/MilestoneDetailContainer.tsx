import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Loader, Alert, Text, Group } from '@mantine/core';
import { COLORS } from '@/shared/constants/colors';
import { useAuth } from '@/shared/hooks/useAuth';
import { useFetchMilestone } from '../../hooks/useFetchMilestone';
import { MilestoneDetail } from './MilestoneDetail';

export const MilestoneDetailContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const milestoneId = id ? parseInt(id, 10) : null;
  const { milestone, loading, error } = useFetchMilestone(milestoneId);

  const handleEdit = () => {
    // TODO: 編集機能の実装
    console.log('Edit milestone:', milestoneId);
  };

  const handleDelete = () => {
    // TODO: 削除機能の実装
    if (window.confirm('このマイルストーンを削除してもよろしいですか？')) {
      console.log('Delete milestone:', milestoneId);
    }
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
    <MilestoneDetail
      milestone={milestone}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};
