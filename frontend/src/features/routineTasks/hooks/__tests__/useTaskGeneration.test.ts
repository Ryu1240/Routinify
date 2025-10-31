import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useTaskGeneration } from '../useTaskGeneration';
import { routineTasksApi, TaskGenerationJob } from '../../api';

vi.mock('../../api');

describe('useTaskGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初期状態が正しいこと', () => {
    const { result } = renderHook(() => useTaskGeneration());

    expect(result.current.state).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.generatedTasksCount).toBeNull();
  });

  it('generateTasksを呼び出すと状態がgeneratingになること', async () => {
    const mockJobResponse = {
      jobId: 'test-job-id',
    };

    (routineTasksApi.generate as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockJobResponse
    );
    (
      routineTasksApi.getGenerationStatus as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      jobId: 'test-job-id',
      status: 'running',
      completed: false,
      createdAt: '2025-10-26T00:00:00Z',
    });

    const { result } = renderHook(() => useTaskGeneration());

    await act(async () => {
      await result.current.generateTasks(123);
    });

    expect(result.current.state).toBe('generating');
    expect(routineTasksApi.generate).toHaveBeenCalledWith(123);
  });

  it('ポーリングでcompletedを検知すると状態がcompletedになること', async () => {
    const mockJobResponse = {
      jobId: 'test-job-id',
    };

    const completedJob: TaskGenerationJob = {
      jobId: 'test-job-id',
      status: 'completed',
      completed: true,
      generatedTasksCount: 5,
      createdAt: '2025-10-26T00:00:00Z',
      completedAt: '2025-10-26T00:05:00Z',
    };

    (routineTasksApi.generate as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockJobResponse
    );
    (
      routineTasksApi.getGenerationStatus as ReturnType<typeof vi.fn>
    ).mockResolvedValue(completedJob);

    const { result } = renderHook(() => useTaskGeneration());

    await act(async () => {
      await result.current.generateTasks(123);
    });

    // ポーリング処理を進める（3秒）
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('completed');
      expect(result.current.generatedTasksCount).toBe(5);
    });
  });

  it('ポーリングでfailedを検知すると状態がfailedになること', async () => {
    const mockJobResponse = {
      jobId: 'test-job-id',
    };

    const failedJob: TaskGenerationJob = {
      jobId: 'test-job-id',
      status: 'failed',
      completed: true,
      error: 'タスク生成エラー',
      createdAt: '2025-10-26T00:00:00Z',
    };

    (routineTasksApi.generate as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockJobResponse
    );
    (
      routineTasksApi.getGenerationStatus as ReturnType<typeof vi.fn>
    ).mockResolvedValue(failedJob);

    const { result } = renderHook(() => useTaskGeneration());

    await act(async () => {
      await result.current.generateTasks(123);
    });

    // ポーリング処理を進める（3秒）
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('failed');
      expect(result.current.error).toBe('タスク生成エラー');
    });
  });

  it('タイムアウト（3分）で状態がfailedになること', async () => {
    const mockJobResponse = {
      jobId: 'test-job-id',
    };

    (routineTasksApi.generate as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockJobResponse
    );
    (
      routineTasksApi.getGenerationStatus as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      jobId: 'test-job-id',
      status: 'running',
      completed: false,
      createdAt: '2025-10-26T00:00:00Z',
    });

    const { result } = renderHook(() => useTaskGeneration());

    await act(async () => {
      await result.current.generateTasks(123);
    });

    // タイムアウト（180秒）を進める
    await act(async () => {
      vi.advanceTimersByTime(180000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('failed');
      expect(result.current.error).toContain('タイムアウト');
    });
  });

  it('reset()で状態がリセットされること', async () => {
    const mockJobResponse = {
      jobId: 'test-job-id',
    };

    (routineTasksApi.generate as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockJobResponse
    );

    const { result } = renderHook(() => useTaskGeneration());

    await act(async () => {
      await result.current.generateTasks(123);
    });

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.generatedTasksCount).toBeNull();
  });
});
