import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from '@/lib/axios';
import { routineTasksApi, TaskGenerationJob } from '../routineTasksApi';

vi.mock('@/lib/axios');

describe('routineTasksApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generate', () => {
    it('POST /api/v1/routine_tasks/:id/generate を呼び出すこと', async () => {
      const mockJob: TaskGenerationJob = {
        jobId: 'test-job-id',
        status: 'pending',
        completed: false,
        createdAt: '2025-10-26T00:00:00Z',
      };

      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          data: mockJob,
        },
      });

      const result = await routineTasksApi.generate(123);

      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/routine_tasks/123/generate'
      );
      expect(result).toEqual(mockJob);
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      await expect(routineTasksApi.generate(123)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('getGenerationStatus', () => {
    it('GET /api/v1/routine_tasks/:id/generation_status を呼び出すこと', async () => {
      const mockJob: TaskGenerationJob = {
        jobId: 'test-job-id',
        status: 'completed',
        completed: true,
        generatedTasksCount: 3,
        createdAt: '2025-10-26T00:00:00Z',
        completedAt: '2025-10-26T00:05:00Z',
      };

      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          data: mockJob,
        },
      });

      const result = await routineTasksApi.getGenerationStatus(
        123,
        'test-job-id'
      );

      expect(axios.get).toHaveBeenCalledWith(
        '/api/v1/routine_tasks/123/generation_status',
        {
          params: { job_id: 'test-job-id' },
        }
      );
      expect(result).toEqual(mockJob);
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Job not found')
      );

      await expect(
        routineTasksApi.getGenerationStatus(123, 'invalid-job-id')
      ).rejects.toThrow('Job not found');
    });
  });
});
