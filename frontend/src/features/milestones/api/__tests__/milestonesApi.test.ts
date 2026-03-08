import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from '@/lib/axios';
import { milestonesApi } from '../milestonesApi';
import type { Milestone } from '@/types/milestone';

vi.mock('@/lib/axios');

const mockMilestone: Milestone = {
  id: 1,
  accountId: 'acc-1',
  name: 'Milestone 1',
  description: null,
  startDate: null,
  dueDate: null,
  status: 'planning',
  completedAt: null,
  progressPercentage: 0,
  totalTasksCount: 0,
  completedTasksCount: 0,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('milestonesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('GET /api/v1/milestones を呼び出しマイルストーン一覧を返すこと', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: [mockMilestone] },
      });

      const result = await milestonesApi.getAll();

      expect(axios.get).toHaveBeenCalledWith('/api/v1/milestones', {
        params: {},
      });
      expect(result).toEqual([mockMilestone]);
    });

    it('filters を渡した場合クエリパラメータとして送信すること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: [] },
      });

      await milestonesApi.getAll({
        status: 'in_progress',
        dueDateRange: 'this_week',
        search: 'test',
        sortBy: 'due_date',
        sortOrder: 'asc',
      });

      expect(axios.get).toHaveBeenCalledWith('/api/v1/milestones', {
        params: {
          status: 'in_progress',
          due_date_range: 'this_week',
          q: 'test',
          sort_by: 'due_date',
          sort_order: 'asc',
        },
      });
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      await expect(milestonesApi.getAll()).rejects.toThrow('Network error');
    });
  });

  describe('getById', () => {
    it('GET /api/v1/milestones/:id を呼び出しマイルストーンを返すこと', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockMilestone },
      });

      // eslint-disable-next-line testing-library/no-await-sync-query -- milestonesApi.getById は非同期API呼び出し
      const result = await milestonesApi.getById(1);

      expect(axios.get).toHaveBeenCalledWith('/api/v1/milestones/1');
      expect(result).toEqual(mockMilestone);
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Not found')
      );

      await expect(milestonesApi.getById(1)).rejects.toThrow('Not found');
    });
  });

  describe('create', () => {
    it('POST /api/v1/milestones を正しい body で呼び出すこと', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, message: 'Created', data: mockMilestone },
      });

      await milestonesApi.create({
        name: 'New Milestone',
        description: 'Desc',
        startDate: '2025-01-01',
        dueDate: '2025-12-31',
        status: 'planning',
      });

      expect(axios.post).toHaveBeenCalledWith('/api/v1/milestones', {
        milestone: {
          name: 'New Milestone',
          description: 'Desc',
          start_date: '2025-01-01',
          due_date: '2025-12-31',
          status: 'planning',
        },
      });
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Create failed')
      );

      await expect(milestonesApi.create({ name: 'New' })).rejects.toThrow(
        'Create failed'
      );
    });
  });

  describe('update', () => {
    it('PUT /api/v1/milestones/:id を正しい body で呼び出し更新後のマイルストーンを返すこと', async () => {
      (axios.put as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: { ...mockMilestone, name: 'Updated' } },
      });

      const result = await milestonesApi.update(1, {
        name: 'Updated Milestone',
        status: 'in_progress',
      });

      expect(axios.put).toHaveBeenCalledWith('/api/v1/milestones/1', {
        milestone: {
          name: 'Updated Milestone',
          status: 'in_progress',
        },
      });
      expect(result.name).toBe('Updated');
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.put as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Update failed')
      );

      await expect(
        milestonesApi.update(1, { name: 'Updated' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('DELETE /api/v1/milestones/:id を呼び出すこと', async () => {
      (axios.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
      });

      await milestonesApi.delete(1);

      expect(axios.delete).toHaveBeenCalledWith('/api/v1/milestones/1');
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.delete as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Delete failed')
      );

      await expect(milestonesApi.delete(1)).rejects.toThrow('Delete failed');
    });
  });

  describe('associateTask', () => {
    it('POST /api/v1/milestones/:id/tasks を正しい body で呼び出しマイルストーンを返すこと', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockMilestone },
      });

      const result = await milestonesApi.associateTask(1, [10, 20]);

      expect(axios.post).toHaveBeenCalledWith('/api/v1/milestones/1/tasks', {
        task: { task_ids: [10, 20] },
      });
      expect(result).toEqual(mockMilestone);
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Associate failed')
      );

      await expect(milestonesApi.associateTask(1, [10])).rejects.toThrow(
        'Associate failed'
      );
    });
  });

  describe('dissociateTask', () => {
    it('DELETE /api/v1/milestones/:id/tasks を data 付きで呼び出しマイルストーンを返すこと', async () => {
      (axios.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockMilestone },
      });

      const result = await milestonesApi.dissociateTask(1, [10, 20]);

      expect(axios.delete).toHaveBeenCalledWith('/api/v1/milestones/1/tasks', {
        data: { task: { task_ids: [10, 20] } },
      });
      expect(result).toEqual(mockMilestone);
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.delete as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Dissociate failed')
      );

      await expect(milestonesApi.dissociateTask(1, [10])).rejects.toThrow(
        'Dissociate failed'
      );
    });
  });
});
