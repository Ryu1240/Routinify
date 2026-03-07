import React from 'react';
import { Container, Group, Title, Stack, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import { ListPageState } from '@/shared/components';
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
  onRetry?: () => void | Promise<void>;
  onCreate?: () => void;
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
  onRetry,
  onCreate,
  onEdit,
  onDelete,
}) => {
  if (authLoading || loading) {
    return (
      <ListPageState
        variant="loading"
        loadingMessage={
          authLoading ? '認証情報を確認中...' : 'マイルストーンを読み込み中...'
        }
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <ListPageState
        variant="unauthenticated"
        unauthenticatedMessage="マイルストーン一覧を表示するにはログインが必要です。"
      />
    );
  }

  if (error) {
    return (
      <ListPageState variant="error" errorMessage={error} onRetry={onRetry} />
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>マイルストーン一覧</Title>
        {onCreate && (
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={onCreate}
            color={COLORS.PRIMARY}
          >
            新規作成
          </Button>
        )}
      </Group>

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
