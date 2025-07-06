import React from 'react';
import { Box, NavLink, Text, rem } from '@mantine/core';
import { IconChecklist, IconPlus } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
      p="md"
      style={{
        borderRight: `${rem(1)} solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))`,
        backgroundColor: 'var(--mantine-color-body)',
        height: 'calc(100vh - 60px)', // ヘッダーの高さ(60px)を引く
        position: 'fixed',
        top: 60, // ヘッダーの下に配置
        left: 0,
        zIndex: 50,
        width: 280,
        overflowY: 'auto'
      }}
    >
      {/* セクション1: タイトル */}
      <Box mb="md">
        <Text size="xs" fw={500} c="dimmed" mb="xs" style={{ textTransform: 'uppercase' }}>
          タスク管理
        </Text>
      </Box>

      {/* セクション2: ナビゲーションリンク */}
      <Box>
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
    </Box>
  );
};

export default Sidebar; 