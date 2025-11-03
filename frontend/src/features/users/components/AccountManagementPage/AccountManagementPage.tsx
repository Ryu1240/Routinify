import React from 'react';
import {
  Container,
  Title,
  TextInput,
  Button,
  Group,
  Alert,
  Text,
  Loader,
} from '@mantine/core';
import { IconSearch, IconAlertCircle } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import { AdminUser } from '../../api/adminUserApi';
import { AccountTable } from '../AccountTable';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

type AccountManagementPageProps = {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  total: number;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  onDeleteClick: (userId: string) => void;
  deleteTargetUserId: string | null;
  deleteModalOpen: boolean;
  onDeleteModalClose: () => void;
  onDeleteConfirm: () => Promise<void>;
  deleteLoading: boolean;
};

export const AccountManagementPage: React.FC<AccountManagementPageProps> = ({
  users,
  loading,
  error,
  total,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onDeleteClick,
  deleteTargetUserId,
  deleteModalOpen,
  onDeleteModalClose,
  onDeleteConfirm,
  deleteLoading,
}) => {
  if (loading && users.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Group justify="center">
          <Loader size="lg" color={COLORS.PRIMARY} />
          <Text c={COLORS.MEDIUM}>読み込み中...</Text>
        </Group>
      </Container>
    );
  }

  const deleteTargetUser = users.find((u) => u.sub === deleteTargetUserId);

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="lg">
        アカウント管理
      </Title>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
          {error}
        </Alert>
      )}

      <Group justify="space-between" mb="md">
        <TextInput
          placeholder="メールアドレス、名前で検索..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSearch();
            }
          }}
          style={{ flex: 1 }}
        />
        <Button onClick={onSearch}>検索</Button>
      </Group>

      <AccountTable
        users={users}
        onDelete={onDeleteClick}
        loading={deleteLoading}
      />

      {total > 0 && (
        <Text size="sm" c="dimmed" ta="center" mt="sm">
          {total}件のユーザーを表示中
        </Text>
      )}

      <DeleteConfirmModal
        opened={deleteModalOpen}
        onClose={onDeleteModalClose}
        onConfirm={onDeleteConfirm}
        userId={deleteTargetUserId || ''}
        userName={deleteTargetUser?.name || deleteTargetUser?.nickname}
        loading={deleteLoading}
      />
    </Container>
  );
};

