import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from '@/lib/axios';
import { tasksApi } from '../tasksApi';
import type { Task } from '@/types';

vi.mock('@/lib/axios');

describe('tasksApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAll', () => {
    it('GET /api/v1/tasks を呼び出しタスク一覧を返すこと', async () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          accountId: 'acc-1',
          title: 'Task 1',
          dueDate: null,
          status: 'pending',
          priority: 'medium',
          categoryId: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: mockTasks },
      });

      const result = await tasksApi.fetchAll();

      expect(axios.get).toHaveBeenCalledWith('/api/v1/tasks', {
        params: {},
      });
      expect(result).toEqual(mockTasks);
    });

    it('include_completed パラメータを送信すること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: [] },
      });

      await tasksApi.fetchAll({ include_completed: true });

      expect(axios.get).toHaveBeenCalledWith('/api/v1/tasks', {
        params: { include_completed: true },
      });
    });

    it('params を渡した場合クエリパラメータとして送信すること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: [] },
      });

      await tasksApi.fetchAll({
        status: 'pending',
        sort_by: 'due_date',
        sort_order: 'asc',
        q: 'test',
        overdue: true,
        due_today: true,
      });

      expect(axios.get).toHaveBeenCalledWith('/api/v1/tasks', {
        params: {
          status: 'pending',
          sort_by: 'due_date',
          sort_order: 'asc',
          q: 'test',
          overdue: 'true',
          due_today: 'true',
        },
      });
    });

    it('skipCache が true の場合キャッシュ無効化ヘッダーと _t を付与すること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { data: [] },
      });

      await tasksApi.fetchAll(undefined, true);

      expect(axios.get).toHaveBeenCalledWith('/api/v1/tasks', {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        params: expect.objectContaining({
          _t: expect.any(Number),
        }),
      });
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      await expect(tasksApi.fetchAll()).rejects.toThrow('Network error');
    });
  });

  describe('create', () => {
    it('POST /api/v1/tasks を正しい body で呼び出すこと', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
      });

      await tasksApi.create({
        title: 'New Task',
        dueDate: '2025-12-31',
        status: 'pending',
        priority: 'high',
        categoryId: 1,
      });

      expect(axios.post).toHaveBeenCalledWith('/api/v1/tasks', {
        task: {
          title: 'New Task',
          due_date: '2025-12-31',
          status: 'pending',
          priority: 'high',
          category_id: 1,
        },
      });
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Create failed')
      );

      await expect(
        tasksApi.create({
          title: 'New Task',
          dueDate: null,
          status: null,
          priority: null,
          categoryId: null,
        })
      ).rejects.toThrow('Create failed');
    });
  });

  describe('update', () => {
    it('PUT /api/v1/tasks/:id を正しい body で呼び出すこと', async () => {
      (axios.put as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
      });

      await tasksApi.update(1, {
        title: 'Updated Task',
        status: 'completed',
      });

      expect(axios.put).toHaveBeenCalledWith('/api/v1/tasks/1', {
        task: {
          title: 'Updated Task',
          status: 'completed',
        },
      });
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.put as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Update failed')
      );

      await expect(tasksApi.update(1, { title: 'Updated' })).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('delete', () => {
    it('DELETE /api/v1/tasks/:id を呼び出すこと', async () => {
      (axios.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
      });

      await tasksApi.delete(1);

      expect(axios.delete).toHaveBeenCalledWith('/api/v1/tasks/1');
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.delete as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Delete failed')
      );

      await expect(tasksApi.delete(1)).rejects.toThrow('Delete failed');
    });
  });
});
