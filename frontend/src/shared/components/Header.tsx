import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Group, Button, Text, Container, rem, Image } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { LAYOUT_CONSTANTS } from '@/shared/constants/layout';

const Header: React.FC = () => {
  const { logout } = useAuth0();

  return (
    <header
      style={{
        borderBottom: `${rem(1)} solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))`,
        backgroundColor: 'var(--mantine-color-body)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Container size="lg">
        <Group justify="space-between" h={LAYOUT_CONSTANTS.HEADER_HEIGHT}>
          {/* 左側: ロゴとサービス名 */}
          <Group gap="xs">
            <Image
              src="/Routinify-Logo.png"
              alt="Routinify Logo"
              w={rem(36)}
              h={rem(36)}
              radius="md"
              style={{ flexShrink: 0 }}
            />
            <Text
              size="xl"
              fw={700}
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
            >
              Routinify
            </Text>
            <Text size="sm" c="dimmed">
              習慣化支援サービス
            </Text>
          </Group>

          {/* 右側: ログアウトボタン */}
          <Button
            variant="subtle"
            leftSection={<IconLogout size={16} />}
            onClick={() =>
              logout({
                logoutParams: {
                  returnTo: window.location.origin,
                },
                openUrl(url) {
                  // Arcブラウザで新しいタブが開くのを防ぐため、window.location.replaceを使用
                  window.location.replace(url);
                },
              })
            }
            color="gray"
          >
            ログアウト
          </Button>
        </Group>
      </Container>
    </header>
  );
};

export default Header;
