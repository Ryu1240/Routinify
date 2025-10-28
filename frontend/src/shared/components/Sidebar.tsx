import React from 'react';
import { Box, NavLink, rem } from '@mantine/core';
import { IconChecklist, IconCategory, IconRepeat } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LAYOUT_CONSTANTS } from '@/shared/constants';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
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
  ];

  return (
    <Box
      component="nav"
      aria-label="Task management navigation"
      p="md"
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
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          label={item.label}
          description={item.description}
          leftSection={item.icon}
          active={location.pathname.startsWith(item.path)}
          onClick={() => navigate(item.path)}
          variant="filled"
          style={{
            borderRadius: 'var(--mantine-radius-sm)',
            marginBottom: 'var(--mantine-spacing-xs)',
          }}
        />
      ))}
    </Box>
  );
};

export default Sidebar;
