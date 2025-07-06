import React from 'react';
import { Box } from '@mantine/core';
import Header from './Header';
import Sidebar from './Sidebar';

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
          marginLeft: 280, // サイドバーの幅
          marginTop: 60, // ヘッダーの高さ
          padding: 'var(--mantine-spacing-md)',
          minHeight: 'calc(100vh - 60px)',
          backgroundColor: 'var(--mantine-color-gray-0)'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 