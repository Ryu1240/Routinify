import React from 'react';
import { Container, Title, Text, Button, Group, Stack } from '@mantine/core';
import { IconLock, IconHome } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

/**
 * 403 Forbidden エラーページ
 * 権限がない場合に表示されるページ
 */
export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="lg">
        <IconLock size={64} stroke={1.5} color="var(--mantine-color-red-6)" />
        <Title order={1} ta="center">
          アクセス権限がありません
        </Title>
        <Text c="dimmed" ta="center" size="lg">
          このページにアクセスするには管理者権限が必要です。
          <br />
          管理者権限をお持ちの場合は、管理者にお問い合わせください。
        </Text>
        <Group mt="md">
          <Button
            leftSection={<IconHome size={16} />}
            onClick={() => navigate('/tasks')}
            variant="filled"
          >
            ホームに戻る
          </Button>
        </Group>
      </Stack>
    </Container>
  );
};

