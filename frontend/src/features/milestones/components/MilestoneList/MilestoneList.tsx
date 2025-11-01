import React from 'react';
import {
  Container,
  Loader,
  Alert,
  Group,
  Text,
  Title,
  Stack,
} from '@mantine/core';
import { COLORS } from '@/shared/constants/colors';
import { Milestone, MilestoneFilters } from '@/types/milestone';
import {
  MilestoneListFilters,
  MilestoneCard,
  MilestoneListEmpty,
  MilestoneListFooter,
} from './components';

type MilestoneListProps = {
  isAuthenticated: boolean;
  authLoading: boolean;
  milestones: Milestone[];
  filters: MilestoneFilters;
  onFilterChange: (
    key: keyof MilestoneFilters,
    value: MilestoneFilters[keyof MilestoneFilters]
  ) => void;
  loading: boolean;
  error: string | null;
  onEdit?: (milestoneId: number) => void;
  onDelete?: (milestoneId: number) => void;
};

export const MilestoneList: React.FC<MilestoneListProps> = ({
  isAuthenticated,
  authLoading,
  milestones,
  filters,
  onFilterChange,
  loading,
  error,
  onEdit,
  onDelete,
}) => {
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
          マイルストーン一覧を表示するにはログインが必要です。
        </Alert>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert title="エラー" color={COLORS.PRIMARY} variant="light">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="lg">
        マイルストーン一覧
      </Title>

      <MilestoneListFilters filters={filters} onFilterChange={onFilterChange} />

      {milestones.length === 0 ? (
        <MilestoneListEmpty />
      ) : (
        <Stack gap="md">
          {milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </Stack>
      )}

      <MilestoneListFooter count={milestones.length} />
    </Container>
  );
};
