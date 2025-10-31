import React, { useRef, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Group,
  Button,
  Text,
  Container,
  rem,
  Image,
  Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLogout, IconRefresh, IconCheck } from '@tabler/icons-react';
import { LAYOUT_CONSTANTS } from '@/shared/constants/layout';
import { useBatchTaskGeneration } from '@/features/routineTasks/hooks/useBatchTaskGeneration';

const Header: React.FC = () => {
  const { logout } = useAuth0();
  const {
    generateAllActiveTasks,
    state,
    completedCount,
    totalCount,
    error,
    reset,
  } = useBatchTaskGeneration();
  const hasShownCompletionNotificationRef = useRef(false);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 完了状態から5秒後に自動的にリセット（一度だけ実行）
  useEffect(() => {
    if (state === 'completed' && resetTimerRef.current === null) {
      resetTimerRef.current = setTimeout(() => {
        reset();
        hasShownCompletionNotificationRef.current = false;
        resetTimerRef.current = null;
      }, 5000);
    }

    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, [state, reset]);

  // 新しい生成が開始されたらタイマーをクリア
  useEffect(() => {
    if (state === 'generating' || state === 'idle') {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      hasShownCompletionNotificationRef.current = false;
    }
  }, [state]);

  const handleBatchGenerate = async () => {
    hasShownCompletionNotificationRef.current = false;

    await generateAllActiveTasks(
      // 全てのタスク生成完了時のコールバック
      () => {
        // 一度だけ完了通知を表示
        // totalCountは最新のstateから取得するため、累積にならない
        if (!hasShownCompletionNotificationRef.current) {
          notifications.show({
            title: '全てのタスク生成が完了しました',
            message: `${totalCount}件の習慣化タスクの生成が完了しました`,
            color: 'green',
            icon: <IconCheck size={16} />,
            autoClose: 5000,
          });
          hasShownCompletionNotificationRef.current = true;
        }

        // データベース反映の時間を考慮して少し遅延してからカスタムイベントを発火
        // これにより、全てのタスクリストコンポーネントが最新データを取得できる
        // 完了後のリフレッシュなので、静かに実行される（UIのチラつきを防ぐ）
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('tasks-refresh', { detail: { silent: true } })
          );
        }, 1000);
      }
    );
  };

  const isGenerating = state === 'generating';
  const isCompleted = state === 'completed';
  const isFailed = state === 'failed';
  const showProgress = isGenerating && totalCount > 0;

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
          {/* 左側: ロゴとサービス名 */}
          <Group gap="xs">
            <Image
              src="/Routinify-Logo.png"
              alt="Routinify Logo"
              w={rem(36)}
              h={rem(36)}
              radius="md"
              style={{ flexShrink: 0 }}
            />
            <Text
              size="xl"
              fw={700}
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
            >
              Routinify
            </Text>
            <Text size="sm" c="dimmed">
              習慣化支援サービス
            </Text>
          </Group>

          {/* 右側: ボタン群 */}
          <Group gap="xs">
            {/* バッチ処理ボタン */}
            <Button
              variant="subtle"
              leftSection={
                isGenerating ? <Loader size={16} /> : <IconRefresh size={16} />
              }
              onClick={handleBatchGenerate}
              disabled={isGenerating}
              color={isFailed ? 'red' : isCompleted ? 'green' : 'blue'}
              title={error || undefined}
            >
              {showProgress
                ? `処理中 (${completedCount}/${totalCount})`
                : isCompleted
                  ? '完了'
                  : isFailed
                    ? 'エラー'
                    : 'タスク生成'}
            </Button>

            {/* ログアウトボタン */}
            <Button
              variant="subtle"
              leftSection={<IconLogout size={16} />}
              onClick={() =>
                logout({
                  logoutParams: {
                    returnTo: window.location.origin,
                  },
                  openUrl(url) {
                    // Arcブラウザで新しいタブが開くのを防ぐため、window.location.replaceを使用
                    window.location.replace(url);
                  },
                })
              }
              color="gray"
            >
              ログアウト
            </Button>
          </Group>
        </Group>
      </Container>
    </header>
  );
};

export default Header;
