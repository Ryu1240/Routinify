import React from 'react';
import { Center, Group, Loader, Text } from '@mantine/core';
import { COLORS } from '@/shared/constants/colors';

interface AuthCheckingScreenProps {
  message?: string;
}

/**
 * 認証・権限チェック中のローディング画面コンポーネント
 * MantineのLoaderを使用して、他の画面と統一されたローディング表示を提供します
 */
export const AuthCheckingScreen: React.FC<AuthCheckingScreenProps> = ({
  message = '認証情報を確認中...',
}) => {
  return (
    <Center style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Group gap="md">
        <Loader size="lg" color={COLORS.PRIMARY} />
        <Text c={COLORS.MEDIUM} size="md">
          {message}
        </Text>
      </Group>
    </Center>
  );
};
