import React, { useEffect, useRef } from 'react';
import { Button, Loader } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useBatchTaskGeneration } from '@/features/routineTasks/hooks/useBatchTaskGeneration';

export const BatchTaskGenerationButton: React.FC = () => {
  const {
    generateAllActiveTasks,
    state,
    totalCount,
    totalGeneratedTasksCount,
    error,
    reset,
  } = useBatchTaskGeneration();

  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 完了状態から5秒後に自動的にリセット（一度だけ実行）
  useEffect(() => {
    if (state === 'completed' && resetTimerRef.current === null) {
      resetTimerRef.current = setTimeout(() => {
        reset();
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
    }
  }, [state]);

  const handleBatchGenerate = async () => {
    await generateAllActiveTasks();
  };

  const isGenerating = state === 'generating';
  const isCompleted = state === 'completed';
  const isFailed = state === 'failed';

  return (
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
      {isGenerating && totalCount > 0
        ? '処理中'
        : isCompleted
          ? `完了 - ${totalGeneratedTasksCount}件生成`
          : isFailed
            ? 'エラー'
            : 'タスク生成'}
    </Button>
  );
};
