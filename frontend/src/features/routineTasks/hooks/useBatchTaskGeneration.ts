import { useState, useCallback, useRef, useEffect } from 'react';
import { routineTasksApi, TaskGenerationJob } from '../api/routineTasksApi';
import { RoutineTask } from '@/types';

type BatchGenerationState = 'idle' | 'generating' | 'completed' | 'failed';

type UseBatchTaskGenerationReturn = {
  state: BatchGenerationState;
  error: string | null;
  completedCount: number;
  totalCount: number;
  generateAllActiveTasks: (
    onTaskComplete?: (routineTaskId: number, title: string) => void,
    onAllComplete?: () => void
  ) => Promise<void>;
  reset: () => void;
};

const POLLING_INTERVAL = 3000; // 3秒
const POLLING_TIMEOUT = 180000; // 3分

type JobStatus = {
  routineTaskId: number;
  jobId: string;
  status: TaskGenerationJob['status'];
  completed: boolean;
  title: string;
};

export const useBatchTaskGeneration = (): UseBatchTaskGenerationReturn => {
  const [state, setState] = useState<BatchGenerationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const jobStatusesRef = useRef<JobStatus[]>([]);

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
    (
      onTaskComplete?: (routineTaskId: number, title: string) => void,
      onAllComplete?: () => void
    ) => {
      cleanup(); // 既存のポーリングをクリーンアップ

      // ポーリング処理
      pollingIntervalRef.current = setInterval(async () => {
        try {
          // 全てのジョブのステータスを確認
          const pendingJobs = jobStatusesRef.current.filter(
            (job) => !job.completed
          );

          if (pendingJobs.length === 0) {
            // 全て完了
            setState('completed');
            setCompletedCount(jobStatusesRef.current.length);
            cleanup();
            // 全て完了時のコールバックを呼び出す
            if (onAllComplete) {
              // データベース反映の時間を考慮して少し遅延
              setTimeout(() => {
                onAllComplete();
              }, 1000);
            }
            return;
          }

          // 各ジョブのステータスを確認
          const statusPromises = pendingJobs.map(async (job) => {
            try {
              const jobStatus: TaskGenerationJob =
                await routineTasksApi.getGenerationStatus(
                  job.routineTaskId,
                  job.jobId
                );

              const wasCompleted = job.completed;
              if (jobStatus.status === 'completed') {
                job.status = 'completed';
                job.completed = true;
                // 新しく完了したタスクに対して通知を表示
                if (onTaskComplete && !wasCompleted) {
                  onTaskComplete(job.routineTaskId, job.title);
                }
              } else if (jobStatus.status === 'failed') {
                job.status = 'failed';
                job.completed = true;
              }
            } catch (err) {
              console.error(
                `ジョブ ${job.jobId} のステータス取得に失敗:`,
                err
              );
              // エラーが発生しても他のジョブの確認は続ける
            }
          });

          await Promise.all(statusPromises);

          // 完了数を更新
          const completed = jobStatusesRef.current.filter(
            (job) => job.completed
          ).length;
          setCompletedCount(completed);

          // 全て完了したか確認
          if (completed === jobStatusesRef.current.length) {
            setState('completed');
            cleanup();
            // 全て完了時のコールバックを呼び出す
            if (onAllComplete) {
              // データベース反映の時間を考慮して少し遅延
              setTimeout(() => {
                onAllComplete();
              }, 1000);
            }
          }
        } catch (err) {
          console.error('バッチ処理のポーリング中にエラーが発生:', err);
          // エラーが発生してもポーリングは継続
        }
      }, POLLING_INTERVAL);

      // タイムアウト処理
      pollingTimeoutRef.current = setTimeout(() => {
        setState('failed');
        setError('バッチ処理がタイムアウトしました（3分経過）');
        cleanup();
      }, POLLING_TIMEOUT);
    },
    [cleanup]
  );

  // 全ての有効な習慣化タスクのタスク生成を開始
  const generateAllActiveTasks = useCallback(
    async (
      onTaskComplete?: (routineTaskId: number, title: string) => void,
      onAllComplete?: () => void
    ) => {
      try {
        setState('generating');
        setError(null);
        setCompletedCount(0);
        setTotalCount(0);
        jobStatusesRef.current = [];

        // 有効な習慣化タスクを取得
        const routineTasks = await routineTasksApi.fetchAll();
        const activeTasks = routineTasks.filter((task) => task.isActive);

        const totalCountValue = activeTasks.length;
        
        if (totalCountValue === 0) {
          setState('completed');
          setTotalCount(0);
          if (onAllComplete) {
            onAllComplete();
          }
          return;
        }

        setTotalCount(totalCountValue);

        // 各タスクに対して非同期処理を開始
        const jobPromises = activeTasks.map(async (task: RoutineTask) => {
          try {
            const job = await routineTasksApi.generate(task.id);
            jobStatusesRef.current.push({
              routineTaskId: task.id,
              jobId: job.jobId,
              status: 'pending',
              completed: false,
              title: task.title,
            });
          } catch (err) {
            console.error(
              `習慣化タスク ${task.id} のジョブ開始に失敗:`,
              err
            );
            // エラーが発生しても他のタスクの処理は続ける
            jobStatusesRef.current.push({
              routineTaskId: task.id,
              jobId: '',
              status: 'failed',
              completed: true,
              title: task.title,
            });
          }
        });

        await Promise.all(jobPromises);

        // ポーリング開始
        if (jobStatusesRef.current.length > 0) {
          startPolling(onTaskComplete, onAllComplete);
        } else {
          setState('completed');
          if (onAllComplete) {
            onAllComplete();
          }
        }
      } catch (err) {
        setState('failed');
        setError(
          err instanceof Error
            ? err.message
            : 'バッチ処理の開始に失敗しました'
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
    setCompletedCount(0);
    setTotalCount(0);
    jobStatusesRef.current = [];
  }, [cleanup]);

  return {
    state,
    error,
    completedCount,
    totalCount,
    generateAllActiveTasks,
    reset,
  };
};
