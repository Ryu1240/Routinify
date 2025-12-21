import React from 'react';
import { Card, Text, Avatar, Button, Stack, Group, Badge, Divider } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import { AdminUser } from '../../api/adminUserApi';
import dayjs from 'dayjs';

type AccountCardProps = {
  user: AdminUser;
  onDelete: (userId: string) => void;
  loading?: boolean;
};

const formatDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
};

export const AccountCard: React.FC<AccountCardProps> = ({
  user,
  onDelete,
  loading = false,
}) => {
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="sm">
        {/* ヘッダー: アバターと名前 */}
        <Group justify="space-between" align="flex-start">
          <Group gap="sm">
            <Avatar src={user.picture} size="md" />
            <Stack gap={2}>
              <Text fw={600} size="lg">
                {user.name || user.nickname || '-'}
              </Text>
              {user.nickname && user.name && (
                <Text size="xs" c="dimmed">
                  @{user.nickname}
                </Text>
              )}
            </Stack>
          </Group>
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
        </Group>

        <Divider />

        {/* メールアドレス */}
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            メールアドレス
          </Text>
          <Text size="sm">{user.email || '-'}</Text>
        </Stack>

        {/* メール検証状態 */}
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            検証済み:
          </Text>
          <Badge color={user.emailVerified ? 'green' : 'red'} variant="light">
            {user.emailVerified ? '✓ 検証済み' : '✗ 未検証'}
          </Badge>
        </Group>

        {/* 日付情報 */}
        <Group gap="md" justify="space-between">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              登録日
            </Text>
            <Text size="sm" c={COLORS.GRAY}>
              {formatDateTime(user.createdAt)}
            </Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              最終ログイン
            </Text>
            <Text size="sm" c={COLORS.GRAY}>
              {formatDateTime(user.lastLogin)}
            </Text>
          </Stack>
        </Group>

        {/* ログイン回数 */}
        {user.loginsCount !== undefined && (
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              ログイン回数
            </Text>
            <Text size="sm" fw={500}>
              {user.loginsCount}回
            </Text>
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

