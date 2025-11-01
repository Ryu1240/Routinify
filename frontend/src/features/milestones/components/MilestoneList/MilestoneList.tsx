import React from 'react';
import {
  Container,
  Loader,
  Alert,
  Group,
  Text,
  Title,
  Stack,
  Button,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
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
  onCreate,
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
