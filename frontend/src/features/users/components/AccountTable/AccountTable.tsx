import React from 'react';
import { DataTable } from '@/shared/components/DataTable/index';
import { TableColumn } from '@/shared/components/DataTable/types';
import { AdminUser } from '../../api/adminUserApi';
import { AccountTableRow } from './AccountTableRow';

const accountColumns: TableColumn[] = [
  { key: 'picture', label: '', sortable: false },
  { key: 'name', label: '名前', sortable: true },
  { key: 'email', label: 'メールアドレス', sortable: true },
  { key: 'emailVerified', label: '検証済み', sortable: true },
  { key: 'createdAt', label: '登録日', sortable: true },
  { key: 'lastLogin', label: '最終ログイン', sortable: true },
  { key: 'actions', label: '操作', isAction: true },
];

type AccountTableProps = {
  users: AdminUser[];
  onDelete: (userId: string) => void;
  loading?: boolean;
};

export const AccountTable: React.FC<AccountTableProps> = ({
  users,
  onDelete,
  loading = false,
}) => {
  return (
    <DataTable>
      <DataTable.Thead>
        <DataTable.HeaderRow
          columns={accountColumns}
          sortBy={null}
          reverseSortDirection={false}
          onSort={() => {}}
        />
      </DataTable.Thead>
      <DataTable.Tbody emptyMessage="ユーザーがありません" colSpan={7}>
        {users.map((user) => (
          <DataTable.Tr key={user.sub}>
            <AccountTableRow
              user={user}
              onDelete={onDelete}
              loading={loading}
            />
          </DataTable.Tr>
        ))}
      </DataTable.Tbody>
    </DataTable>
  );
};
