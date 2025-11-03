import React, { useState, useCallback } from 'react';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { AccountManagementPage } from './AccountManagementPage';

export const AccountManagementPageContainer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetUserId, setDeleteTargetUserId] = useState<string | null>(
    null
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const { users, loading, error, total, params, setParams, deleteUser } =
    useAdminUsers({
      perPage: 50,
    });

  const handleSearch = useCallback(() => {
    setParams({
      ...params,
      q: searchQuery || undefined,
      page: 1,
    });
  }, [searchQuery, params, setParams]);

  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleDeleteClick = useCallback((userId: string) => {
    setDeleteTargetUserId(userId);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteModalClose = useCallback(() => {
    setDeleteModalOpen(false);
    setDeleteTargetUserId(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTargetUserId) {
      try {
        await deleteUser(deleteTargetUserId);
        setDeleteModalOpen(false);
        setDeleteTargetUserId(null);
      } catch (err) {
        // エラーはuseAdminUsersで処理される
        console.error('ユーザー削除に失敗:', err);
      }
    }
  }, [deleteTargetUserId, deleteUser]);

  return (
    <AccountManagementPage
      users={users}
      loading={loading}
      error={error}
      total={total}
      searchQuery={searchQuery}
      onSearchQueryChange={handleSearchQueryChange}
      onSearch={handleSearch}
      onDeleteClick={handleDeleteClick}
      deleteTargetUserId={deleteTargetUserId}
      deleteModalOpen={deleteModalOpen}
      onDeleteModalClose={handleDeleteModalClose}
      onDeleteConfirm={handleDeleteConfirm}
      deleteLoading={loading}
    />
  );
};
