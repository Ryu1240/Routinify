import React from 'react';
import {
  Container,
  Loader,
  Alert,
  TextInput,
  Group,
  Text,
  Card,
  Badge,
  Progress,
  Select,
  Title,
  ActionIcon,
  Stack,
} from '@mantine/core';
import { IconSearch, IconEdit, IconTrash } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import {
  Milestone,
  MilestoneFilters,
  MILESTONE_STATUS_LABELS,
  DUE_DATE_RANGE_LABELS,
} from '@/types/milestone';

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

const getStatusColor = (status: Milestone['status']): string => {
  switch (status) {
    case 'planning':
      return 'gray';
    case 'in_progress':
      return 'blue';
    case 'completed':
      return 'green';
    case 'cancelled':
      return 'red';
    default:
      return 'gray';
  }
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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

      <Stack gap="md" mb="lg">
        <Group grow>
          <TextInput
            placeholder="マイルストーン名で検索..."
            leftSection={<IconSearch size={16} color={COLORS.PRIMARY} />}
            value={filters.search || ''}
            onChange={(event) =>
              onFilterChange('search', event.currentTarget.value)
            }
            styles={{
              input: {
                borderColor: COLORS.LIGHT,
                '&:focus': {
                  borderColor: COLORS.PRIMARY,
                },
              },
            }}
          />
        </Group>

        <Group grow>
          <Select
            label="ステータス"
            placeholder="すべて"
            data={[
              { value: '', label: 'すべて' },
              { value: 'planning', label: MILESTONE_STATUS_LABELS.planning },
              {
                value: 'in_progress',
                label: MILESTONE_STATUS_LABELS.in_progress,
              },
              { value: 'completed', label: MILESTONE_STATUS_LABELS.completed },
              { value: 'cancelled', label: MILESTONE_STATUS_LABELS.cancelled },
            ]}
            value={filters.status || ''}
            onChange={(value) =>
              onFilterChange(
                'status',
                (value as Milestone['status']) || undefined
              )
            }
            clearable
          />

          <Select
            label="期限範囲"
            placeholder="すべて"
            data={[
              { value: '', label: 'すべて' },
              { value: 'overdue', label: DUE_DATE_RANGE_LABELS.overdue },
              { value: 'today', label: DUE_DATE_RANGE_LABELS.today },
              { value: 'this_week', label: DUE_DATE_RANGE_LABELS.this_week },
              { value: 'this_month', label: DUE_DATE_RANGE_LABELS.this_month },
            ]}
            value={filters.dueDateRange || ''}
            onChange={(value) =>
              onFilterChange(
                'dueDateRange',
                (value as MilestoneFilters['dueDateRange']) || undefined
              )
            }
            clearable
          />

          <Select
            label="ソート"
            placeholder="作成日"
            data={[
              { value: 'created_at', label: '作成日' },
              { value: 'due_date', label: '期限日' },
              { value: 'progress', label: '進捗率' },
            ]}
            value={filters.sortBy || 'created_at'}
            onChange={(value) =>
              onFilterChange(
                'sortBy',
                (value as MilestoneFilters['sortBy']) || 'created_at'
              )
            }
          />

          <Select
            label="順序"
            placeholder="降順"
            data={[
              { value: 'desc', label: '降順' },
              { value: 'asc', label: '昇順' },
            ]}
            value={filters.sortOrder || 'desc'}
            onChange={(value) =>
              onFilterChange(
                'sortOrder',
                (value as MilestoneFilters['sortOrder']) || 'desc'
              )
            }
          />
        </Group>
      </Stack>

      {milestones.length === 0 ? (
        <Alert
          title="マイルストーンがありません"
          color={COLORS.PRIMARY}
          variant="light"
        >
          マイルストーンが存在しません。
        </Alert>
      ) : (
        <Stack gap="md">
          {milestones.map((milestone) => (
            <Card
              key={milestone.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
            >
              <Group justify="space-between" mb="xs">
                <Group>
                  <Title order={4}>{milestone.name}</Title>
                  <Badge
                    color={getStatusColor(milestone.status)}
                    variant="light"
                  >
                    {MILESTONE_STATUS_LABELS[milestone.status]}
                  </Badge>
                </Group>
                <Group gap="xs">
                  {onEdit && (
                    <ActionIcon
                      variant="subtle"
                      color={COLORS.PRIMARY}
                      onClick={() => onEdit(milestone.id)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  )}
                  {onDelete && (
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => onDelete(milestone.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  )}
                </Group>
              </Group>

              {milestone.description && (
                <Text size="sm" c="dimmed" mb="md">
                  {milestone.description}
                </Text>
              )}

              <Group mb="md">
                <Text size="sm">
                  <Text span fw={500}>
                    開始日:
                  </Text>{' '}
                  {formatDate(milestone.startDate)}
                </Text>
                <Text size="sm">
                  <Text span fw={500}>
                    期限日:
                  </Text>{' '}
                  {formatDate(milestone.dueDate)}
                </Text>
                <Text size="sm">
                  <Text span fw={500}>
                    タスク:
                  </Text>{' '}
                  {milestone.completedTasksCount}/{milestone.totalTasksCount}{' '}
                  完了
                </Text>
              </Group>

              <Group gap="xs" align="center">
                <Progress
                  value={milestone.progressPercentage}
                  size="lg"
                  radius="xl"
                  color={
                    milestone.progressPercentage === 100
                      ? 'green'
                      : COLORS.PRIMARY
                  }
                  style={{ flex: 1 }}
                />
                <Text size="sm" fw={500} c="dimmed">
                  {milestone.progressPercentage}%
                </Text>
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      {milestones.length > 0 && (
        <Text size="sm" c={COLORS.GRAY} ta="center" mt="md">
          {milestones.length}件のマイルストーンを表示中
        </Text>
      )}
    </Container>
  );
};
