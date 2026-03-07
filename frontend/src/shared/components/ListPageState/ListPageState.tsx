import React from 'react';
import {
  Container,
  Group,
  Stack,
  Loader,
  Text,
  Alert,
  Button,
} from '@mantine/core';
import { COLORS } from '@/shared/constants/colors';

export type ListPageStateProps = {
  variant: 'loading' | 'error' | 'unauthenticated';
  loadingMessage?: string;
  errorMessage?: string;
  unauthenticatedMessage?: string;
  onRetry?: () => void | Promise<void>;
};

export const ListPageState: React.FC<ListPageStateProps> = ({
  variant,
  loadingMessage = '読み込み中...',
  errorMessage = 'データの取得に失敗しました。',
  unauthenticatedMessage = '表示するにはログインが必要です。',
  onRetry,
}) => {
  if (variant === 'loading') {
    return (
      <Container size="xl" py="xl">
        <Group justify="center">
          <Loader size="lg" color={COLORS.PRIMARY} />
          <Text c={COLORS.MEDIUM}>{loadingMessage}</Text>
        </Group>
      </Container>
    );
  }

  if (variant === 'unauthenticated') {
    return (
      <Container size="xl" py="xl">
        <Alert title="認証が必要" color={COLORS.PRIMARY} variant="light">
          {unauthenticatedMessage}
        </Alert>
      </Container>
    );
  }

  if (variant === 'error') {
    return (
      <Container size="xl" py="xl">
        <Stack gap="md">
          <Alert title="エラー" color={COLORS.PRIMARY} variant="light">
            {errorMessage}
          </Alert>
          {onRetry && (
            <Group justify="center">
              <Button color={COLORS.PRIMARY} onClick={onRetry}>
                再取得
              </Button>
            </Group>
          )}
        </Stack>
      </Container>
    );
  }

  return null;
};
