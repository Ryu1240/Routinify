import React from 'react';
import { Box, NavLink, rem, Drawer, Stack } from '@mantine/core';
import {
  IconChecklist,
  IconCategory,
  IconRepeat,
  IconFlag,
  IconChartBar,
  IconHome,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LAYOUT_CONSTANTS } from '@/shared/constants';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';

interface SidebarProps {
  drawerOpened?: boolean;
  onDrawerClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  drawerOpened = false,
  onDrawerClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const navItems = [
    {
      label: 'ダッシュボード',
      icon: <IconHome size={16} />,
      path: '/dashboard',
      description: 'タスクと習慣化の概要を表示',
    },
    {
      label: 'タスク一覧',
      icon: <IconChecklist size={16} />,
      path: '/tasks',
      description: 'すべてのタスクを表示',
    },
    {
      label: '習慣化タスク',
      icon: <IconRepeat size={16} />,
      path: '/routine-tasks',
      description: '習慣化タスクの管理',
    },
    {
      label: 'カテゴリ管理',
      icon: <IconCategory size={16} />,
      path: '/categories',
      description: 'カテゴリの作成・編集',
    },
    {
      label: 'マイルストーン',
      icon: <IconFlag size={16} />,
      path: '/milestones',
      description: 'マイルストーンの管理',
    },
    {
      label: '習慣化状況',
      icon: <IconChartBar size={16} />,
      path: '/achievements',
      description: '習慣化タスクの達成状況',
    },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile && onDrawerClose) {
      onDrawerClose();
    }
  };

  const sidebarContent = (
    <Stack gap="xs" p="md">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          label={item.label}
          description={item.description}
          leftSection={item.icon}
          active={location.pathname.startsWith(item.path)}
          onClick={() => handleNavClick(item.path)}
          variant="filled"
          style={{
            borderRadius: 'var(--mantine-radius-sm)',
          }}
        />
      ))}
    </Stack>
  );

  if (isMobile) {
    return (
      <Drawer
        opened={drawerOpened}
        onClose={onDrawerClose || (() => {})}
        title="メニュー"
        position="left"
        size="sm"
        zIndex={1000}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Box
      component="nav"
      aria-label="Task management navigation"
      style={{
        borderRight: `${rem(1)} solid var(--mantine-color-gray-3)`,
        backgroundColor: 'var(--mantine-color-gray-0)',
        height: `calc(100vh - ${LAYOUT_CONSTANTS.HEADER_HEIGHT}px)`,
        position: 'fixed',
        top: LAYOUT_CONSTANTS.HEADER_HEIGHT,
        left: 0,
        zIndex: 50,
        width: LAYOUT_CONSTANTS.SIDEBAR_WIDTH,
        overflowY: 'auto',
      }}
    >
      {sidebarContent}
    </Box>
  );
};

export default Sidebar;
