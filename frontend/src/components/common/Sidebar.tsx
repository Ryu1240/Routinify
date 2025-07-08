import React from 'react';
import { Box, NavLink, rem, useMantineTheme } from '@mantine/core';
import { IconChecklist, IconPlus } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LAYOUT_CONSTANTS } from '../../constants/layout';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useMantineTheme();

  const navItems = [
    {
      label: 'タスク一覧',
      icon: <IconChecklist size={16} />,
      path: '/tasks',
      description: 'すべてのタスクを表示'
    },
    {
      label: 'タスク作成',
      icon: <IconPlus size={16} />,
      path: '/tasks/new',
      description: '新しいタスクを作成'
    }
  ];

  return (
    <Box
      component="nav"
      aria-label="Task management navigation"
      p="md"
      style={{
        borderRight: `${rem(1)} solid ${theme.colors.gray[3]}`,
        backgroundColor: theme.colors.gray[0],
        height: `calc(100vh - ${LAYOUT_CONSTANTS.HEADER_HEIGHT})`, // ヘッダーの高さを引く
        position: 'fixed',
        top: LAYOUT_CONSTANTS.HEADER_HEIGHT, // ヘッダーの下に配置
        left: 0,
        zIndex: 50,
        width: LAYOUT_CONSTANTS.SIDEBAR_WIDTH,
        overflowY: 'auto',
        '@media (max-width: 768px)': {
          transform: 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        },
      }}
    >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            description={item.description}
            leftSection={item.icon}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            variant="filled"
            style={{
              borderRadius: 'var(--mantine-radius-sm)',
              marginBottom: 'var(--mantine-spacing-xs)'
            }}
          />
        ))}
      </Box>
  );
};

export default Sidebar; 