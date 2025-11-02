import React, { useState, useCallback, useRef, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { routineTasksApi, TaskGenerationJob } from '../api/routineTasksApi';
import { RoutineTask } from '@/types';

type BatchGenerationState = 'idle' | 'generating' | 'completed' | 'failed';

type UseBatchTaskGenerationReturn = {
  state: BatchGenerationState;
  error: string | null;
  completedCount: number;
  totalCount: number;
  totalGeneratedTasksCount: number;
  generateAllActiveTasks: () => Promise<void>;
  reset: () => void;
};

const POLLING_INTERVAL = 3000; // 3秒
const POLLING_TIMEOUT = 180000; // 3分
const BATCH_SIZE = 10; // 一度に処理するリクエスト数
const BATCH_DELAY = 200; // バッチ間の待機時間（ミリ秒）
const MAX_RETRIES = 3; // 最大リトライ回数
const RETRY_DELAY = 1000; // リトライ間の待機時間（ミリ秒）

type JobStatus = {
  routineTaskId: number;
  jobId: string;
  status: TaskGenerationJob['status'];
  completed: boolean;
  title: string;
  generatedTasksCount?: number;
};

export const useBatchTaskGeneration = (): UseBatchTaskGenerationReturn => {
  const [state, setState] = useState<BatchGenerationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [totalGeneratedTasksCount, setTotalGeneratedTasksCount] = useState(0);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const jobStatusesRef = useRef<JobStatus[]>([]);
  const hasShownCompletionNotificationRef = useRef(false);

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

  // 全完了時の処理（集計と通知）
  const handleAllComplete = useCallback(() => {
    // 合計生成件数を計算
    const totalGenerated = jobStatusesRef.current.reduce((sum, job) => {
      const count = job.generatedTasksCount || 0;
      return sum + count;
    }, 0);
    setTotalGeneratedTasksCount(totalGenerated);

    // 一度だけ完了通知を表示
    if (!hasShownCompletionNotificationRef.current) {
      notifications.show({
        title: '全てのタスク生成が完了しました',
        message: `${totalGenerated}件の習慣化タスクの生成が完了しました`,
        color: 'green',
        icon: React.createElement(IconCheck, { size: 16 }),
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
  }, []);

  // ポーリング処理
  const startPolling = useCallback(() => {
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
          // 全て完了時の処理を実行
          handleAllComplete();
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

            if (jobStatus.status === 'completed') {
              job.status = 'completed';
              job.completed = true;
              // 生成件数を保存（APIから取得した値）
              if (jobStatus.generatedTasksCount !== undefined) {
                job.generatedTasksCount = jobStatus.generatedTasksCount;
              } else {
                // 未定義の場合は0として扱う
                job.generatedTasksCount = 0;
              }
            } else if (jobStatus.status === 'failed') {
              job.status = 'failed';
              job.completed = true;
              // 失敗した場合は生成件数は0
              job.generatedTasksCount = 0;
            }
          } catch (err) {
            // タイムアウトエラーなどの一時的なエラーは次のポーリングで再試行されるため、静かに処理
            // 重大なエラーの場合のみログに記録
            if (err instanceof Error && !err.message.includes('timeout')) {
              console.error(`ジョブ ${job.jobId} のステータス取得に失敗:`, err);
            }
            // エラーが発生しても他のジョブの確認は続ける
          }
        });

        await Promise.all(statusPromises);

        // 完了数を更新
        const completed = jobStatusesRef.current.filter(
          (job) => job.completed
        ).length;

        // ジョブ完了検知後に即座に生成件数を更新
        const currentTotalGenerated = jobStatusesRef.current.reduce(
          (sum, job) => {
            // 完了したジョブのみを集計対象とする
            if (job.completed && job.generatedTasksCount !== undefined) {
              return sum + job.generatedTasksCount;
            }
            return sum;
          },
          0
        );

        // 完了数と生成件数を更新
        // setInterval内での更新を確実にするため、setTimeoutでラップ
        setTimeout(() => {
          setCompletedCount(completed);
          setTotalGeneratedTasksCount(currentTotalGenerated);
        }, 0);

        // 全て完了したか確認
        if (completed === jobStatusesRef.current.length) {
          setState('completed');
          cleanup();
          // 全て完了時の処理を実行（集計と通知はここで行う）
          handleAllComplete();
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
  }, [cleanup, handleAllComplete]);

  // 全ての有効な習慣化タスクのタスク生成を開始
  const generateAllActiveTasks = useCallback(async () => {
    try {
      setState('generating');
      setError(null);
      setCompletedCount(0);
      setTotalCount(0);
      setTotalGeneratedTasksCount(0);
      hasShownCompletionNotificationRef.current = false;
      jobStatusesRef.current = [];

      // 有効な習慣化タスクを取得
      const routineTasks = await routineTasksApi.fetchAll();
      const activeTasks = routineTasks.filter((task) => task.isActive);

      const totalCountValue = activeTasks.length;

      if (totalCountValue === 0) {
        setState('completed');
        setTotalCount(0);
        setTotalGeneratedTasksCount(0);
        handleAllComplete();
        return;
      }

      setTotalCount(totalCountValue);

      // リトライ機能付きのジョブ生成関数
      const generateJobWithRetry = async (
        task: RoutineTask,
        retryCount = 0
      ): Promise<void> => {
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
          // タイムアウトエラーでリトライ回数が上限に達していない場合は再試行
          const isTimeoutError =
            err instanceof Error &&
            (err.message.includes('timeout') ||
              err.message.includes('ECONNABORTED'));

          if (isTimeoutError && retryCount < MAX_RETRIES) {
            // リトライ前に待機
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            return generateJobWithRetry(task, retryCount + 1);
          }

          // リトライ上限に達した、またはタイムアウト以外のエラーの場合
          console.error(
            `習慣化タスク ${task.id} のジョブ開始に失敗 (リトライ ${retryCount}/${MAX_RETRIES}):`,
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
      };

      // バッチ処理: タスクをバッチサイズごとに分割して順次処理
      for (let i = 0; i < activeTasks.length; i += BATCH_SIZE) {
        const batch = activeTasks.slice(i, i + BATCH_SIZE);

        // バッチ内のリクエストを並行処理
        const batchPromises = batch.map((task) => generateJobWithRetry(task));

        await Promise.all(batchPromises);

        // 最後のバッチでない場合、次のバッチの前に待機
        if (i + BATCH_SIZE < activeTasks.length) {
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
        }
      }

      // ポーリング開始
      if (jobStatusesRef.current.length > 0) {
        startPolling();
      } else {
        setState('completed');
        setTotalGeneratedTasksCount(0);
        handleAllComplete();
      }
    } catch (err) {
      setState('failed');
      setError(
        err instanceof Error ? err.message : 'バッチ処理の開始に失敗しました'
      );
      cleanup();
    }
  }, [startPolling, cleanup, handleAllComplete]);

  // リセット
  const reset = useCallback(() => {
    cleanup();
    setState('idle');
    setError(null);
    setCompletedCount(0);
    setTotalCount(0);
    setTotalGeneratedTasksCount(0);
    hasShownCompletionNotificationRef.current = false;
    jobStatusesRef.current = [];
  }, [cleanup]);

  return {
    state,
    error,
    completedCount,
    totalCount,
    totalGeneratedTasksCount,
    generateAllActiveTasks,
    reset,
  };
};
