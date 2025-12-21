import React, { useState } from 'react';
import { Box } from '@mantine/core';
import { Header, Sidebar } from './';
import { LAYOUT_CONSTANTS } from '@/shared/constants/layout';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [drawerOpened, setDrawerOpened] = useState(false);
  const isMobile = useIsMobile();

  const handleDrawerToggle = () => {
    setDrawerOpened((opened) => !opened);
  };

  const handleDrawerClose = () => {
    setDrawerOpened(false);
  };

  return (
    <Box style={{ minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Header
        drawerOpened={drawerOpened}
        onDrawerToggle={handleDrawerToggle}
      />

      {/* サイドバー */}
      <Sidebar
        drawerOpened={drawerOpened}
        onDrawerClose={handleDrawerClose}
      />

      {/* メインコンテンツ */}
      <Box
        style={{
          marginLeft: isMobile ? 0 : LAYOUT_CONSTANTS.SIDEBAR_WIDTH,
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
