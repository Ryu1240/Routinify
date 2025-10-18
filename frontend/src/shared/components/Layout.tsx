import React from 'react';
import { Box } from '@mantine/core';
import { Header, Sidebar } from './';
import { LAYOUT_CONSTANTS } from '@/shared/constants/layout';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box style={{ minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Header />

      {/* サイドバー */}
      <Sidebar />

      {/* メインコンテンツ */}
      <Box
        style={{
          marginLeft: LAYOUT_CONSTANTS.SIDEBAR_WIDTH,
          marginTop: LAYOUT_CONSTANTS.HEADER_HEIGHT,
          padding: 'var(--mantine-spacing-md)',
          minHeight: `calc(100vh - ${LAYOUT_CONSTANTS.HEADER_HEIGHT}px)`,
          backgroundColor: 'var(--mantine-color-gray-0)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
