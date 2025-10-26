import { useState, useCallback, useEffect, useRef } from 'react';
import { routineTasksApi, TaskGenerationJob } from '../api';

type GenerationState = 'idle' | 'generating' | 'completed' | 'failed';

type UseTaskGenerationReturn = {
  state: GenerationState;
  error: string | null;
  generatedTasksCount: number | null;
  generateTasks: (routineTaskId: number) => Promise<void>;
  reset: () => void;
};

const POLLING_INTERVAL = 3000; // 3秒
const POLLING_TIMEOUT = 180000; // 3分

export const useTaskGeneration = (): UseTaskGenerationReturn => {
  const [state, setState] = useState<GenerationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [generatedTasksCount, setGeneratedTasksCount] = useState<number | null>(
    null
  );

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // クリーンアップ関数
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  // コンポーネントのアンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // ポーリング処理
  const startPolling = useCallback(
    (routineTaskId: number, jobId: string) => {
      cleanup(); // 既存のポーリングをクリーンアップ

      // ポーリング処理
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const jobStatus: TaskGenerationJob =
            await routineTasksApi.getGenerationStatus(routineTaskId, jobId);

          if (jobStatus.status === 'completed') {
            setState('completed');
            setGeneratedTasksCount(jobStatus.generatedTasksCount || 0);
            cleanup();
          } else if (jobStatus.status === 'failed') {
            setState('failed');
            setError(jobStatus.error || 'タスク生成に失敗しました');
            cleanup();
          }
          // pending または running の場合は継続してポーリング
        } catch (err) {
          setState('failed');
          setError(
            err instanceof Error
              ? err.message
              : 'ステータスの取得に失敗しました'
          );
          cleanup();
        }
      }, POLLING_INTERVAL);

      // タイムアウト処理
      pollingTimeoutRef.current = setTimeout(() => {
        setState('failed');
        setError('タスク生成がタイムアウトしました（3分経過）');
        cleanup();
      }, POLLING_TIMEOUT);
    },
    [cleanup]
  );

  // タスク生成を開始
  const generateTasks = useCallback(
    async (routineTaskId: number) => {
      try {
        setState('generating');
        setError(null);
        setGeneratedTasksCount(null);

        // タスク生成ジョブを開始
        const job: TaskGenerationJob =
          await routineTasksApi.generate(routineTaskId);

        // ポーリング開始
        startPolling(routineTaskId, job.jobId);
      } catch (err) {
        setState('failed');
        setError(
          err instanceof Error ? err.message : 'タスク生成の開始に失敗しました'
        );
        cleanup();
      }
    },
    [startPolling, cleanup]
  );

  // リセット
  const reset = useCallback(() => {
    cleanup();
    setState('idle');
    setError(null);
    setGeneratedTasksCount(null);
  }, [cleanup]);

  return {
    state,
    error,
    generatedTasksCount,
    generateTasks,
    reset,
  };
};
