import React from 'react';
import { Text, Avatar, Button } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { DataTable } from '@/shared/components/DataTable/index';
import { COLORS } from '@/shared/constants/colors';
import { AdminUser } from '../../api/adminUserApi';
import dayjs from 'dayjs';

type AccountTableRowProps = {
  user: AdminUser;
  onDelete: (userId: string) => void;
  loading?: boolean;
};

const formatDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
};

export const AccountTableRow: React.FC<AccountTableRowProps> = ({
  user,
  onDelete,
  loading = false,
}) => {
  return (
    <>
      <DataTable.Td>
        <Avatar src={user.picture} size="sm" />
      </DataTable.Td>
      <DataTable.Td>
        <Text fw={500}>{user.name || user.nickname || '-'}</Text>
      </DataTable.Td>
      <DataTable.Td>
        <Text>{user.email || '-'}</Text>
      </DataTable.Td>
      <DataTable.Td>
        <Text>{user.emailVerified ? '✓' : '✗'}</Text>
      </DataTable.Td>
      <DataTable.Td>
        <Text size="sm" c={COLORS.GRAY}>
          {formatDateTime(user.createdAt)}
        </Text>
      </DataTable.Td>
      <DataTable.Td>
        <Text size="sm" c={COLORS.GRAY}>
          {formatDateTime(user.lastLogin)}
        </Text>
      </DataTable.Td>
      <DataTable.Td>
        <Button
          color="red"
          variant="light"
          size="xs"
          leftSection={<IconTrash size={14} />}
          onClick={() => onDelete(user.sub)}
          loading={loading}
        >
          削除
        </Button>
      </DataTable.Td>
    </>
  );
};
