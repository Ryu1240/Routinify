import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Group, Button, Text, Container, rem, Image, Burger, ActionIcon, Tooltip, Menu } from '@mantine/core';
import { IconLogout, IconUsers, IconDots } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { LAYOUT_CONSTANTS } from '@/shared/constants/layout';
import { BatchTaskGenerationButton } from './BatchTaskGenerationButton';
import { useHasAdminRole } from '@/shared/hooks/useHasAdminRole';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';

interface HeaderProps {
  drawerOpened?: boolean;
  onDrawerToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  drawerOpened = false,
  onDrawerToggle,
}) => {
  const { logout } = useAuth0();
  const navigate = useNavigate();
  const { hasAdminRole, isLoading } = useHasAdminRole();
  const isMobile = useIsMobile();

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
          {/* 左側: ハンバーガーメニュー（モバイル時のみ）とロゴ */}
          <Group gap="xs">
            {isMobile && onDrawerToggle && (
              <Burger
                opened={drawerOpened}
                onClick={onDrawerToggle}
                size="sm"
                aria-label="メニューを開く"
              />
            )}
            <Image
              src="/Routinify-Logo.png"
              alt="Routinify Logo"
              w={rem(36)}
              h={rem(36)}
              radius="md"
              style={{ flexShrink: 0 }}
            />
            <Text
              size={isMobile ? 'lg' : 'xl'}
              fw={700}
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
            >
              Routinify
            </Text>
            {!isMobile && (
              <Text size="sm" c="dimmed">
                習慣化支援サービス
              </Text>
            )}
          </Group>

          {/* 右側: ボタン群 */}
          {isMobile ? (
            <Group gap="xs">
              {/* バッチ処理ボタンはアイコンのみ（頻繁に使用されるため外に表示） */}
              <BatchTaskGenerationButton />
              {/* モバイル時: メニューにまとめる */}
              <Menu shadow="md" width={220} position="bottom-end">
                <Menu.Target>
                  <Tooltip label="メニュー">
                    <ActionIcon variant="subtle" size="lg">
                      <IconDots size={20} />
                    </ActionIcon>
                  </Tooltip>
                </Menu.Target>
                <Menu.Dropdown>
                  {hasAdminRole && !isLoading && (
                    <Menu.Item
                      leftSection={<IconUsers size={16} />}
                      onClick={() => navigate('/admin/accounts')}
                    >
                      アカウント管理
                    </Menu.Item>
                  )}
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconLogout size={16} />}
                    onClick={() =>
                      logout({
                        logoutParams: {
                          returnTo: window.location.origin,
                        },
                        openUrl(url) {
                          window.location.replace(url);
                        },
                      })
                    }
                    color="red"
                  >
                    ログアウト
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          ) : (
            <Group gap="xs">
              {/* デスクトップ時: 通常のボタン表示 */}
              {hasAdminRole && !isLoading && (
                <Button
                  variant="subtle"
                  leftSection={<IconUsers size={16} />}
                  onClick={() => navigate('/admin/accounts')}
                  color="blue"
                  size="sm"
                >
                  アカウント管理
                </Button>
              )}
              <BatchTaskGenerationButton />
              <Button
                variant="subtle"
                leftSection={<IconLogout size={16} />}
                onClick={() =>
                  logout({
                    logoutParams: {
                      returnTo: window.location.origin,
                    },
                    openUrl(url) {
                      window.location.replace(url);
                    },
                  })
                }
                color="gray"
                size="sm"
              >
                ログアウト
              </Button>
            </Group>
          )}
        </Group>
      </Container>
    </header>
  );
};

export default Header;
