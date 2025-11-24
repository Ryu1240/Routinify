import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from '@/lib/axios';
import { adminUserApi, AdminUser } from './adminUserApi';

vi.mock('@/lib/axios');

describe('adminUserApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('パラメータなしでGET /api/v1/admin/users を呼び出すこと', async () => {
      const mockUsers: AdminUser[] = [
        {
          sub: 'auth0|123',
          name: 'Test User 1',
          email: 'user1@example.com',
          picture: 'https://example.com/pic1.jpg',
          nickname: 'user1',
          emailVerified: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          lastLogin: '2024-01-15T00:00:00.000Z',
          loginsCount: 10,
        },
        {
          sub: 'auth0|456',
          name: 'Test User 2',
          email: 'user2@example.com',
          picture: 'https://example.com/pic2.jpg',
          nickname: 'user2',
          emailVerified: false,
          createdAt: '2024-01-03T00:00:00.000Z',
          updatedAt: '2024-01-04T00:00:00.000Z',
          lastLogin: '2024-01-14T00:00:00.000Z',
          loginsCount: 5,
        },
      ];

      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          data: {
            users: mockUsers,
            total: 2,
            start: 0,
            limit: 50,
          },
        },
      });

      const result = await adminUserApi.list();

      expect(axios.get).toHaveBeenCalledWith('/api/v1/admin/users', {
        params: {},
      });
      expect(result.data).toEqual(mockUsers);
      expect(result.total).toBe(2);
      expect(result.start).toBe(0);
      expect(result.limit).toBe(50);
    });

    it('パラメータありでGET /api/v1/admin/users を呼び出すこと', async () => {
      const mockUsers: AdminUser[] = [
        {
          sub: 'auth0|123',
          name: 'Test User',
          email: 'user@example.com',
          emailVerified: true,
        },
      ];

      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          data: {
            users: mockUsers,
            total: 1,
            start: 0,
            limit: 20,
          },
        },
      });

      const params = {
        page: 1,
        perPage: 20,
        q: 'email:user@example.com',
        sort: 'createdAt',
        order: 'desc' as const,
      };

      const result = await adminUserApi.list(params);

      expect(axios.get).toHaveBeenCalledWith('/api/v1/admin/users', {
        params: {
          page: 1,
          per_page: 20,
          q: 'email:user@example.com',
          sort: 'createdAt',
          order: 'desc',
        },
      });
      expect(result.data).toEqual(mockUsers);
      expect(result.total).toBe(1);
    });

    it('total/start/limitがundefinedの場合、デフォルト値0を返すこと', async () => {
      const mockUsers: AdminUser[] = [];

      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          data: {
            users: mockUsers,
          },
        },
      });

      const result = await adminUserApi.list();

      expect(result.total).toBe(0);
      expect(result.start).toBe(0);
      expect(result.limit).toBe(0);
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      await expect(adminUserApi.list()).rejects.toThrow('Network error');
    });
  });

  describe('delete', () => {
    it('DELETE /api/v1/admin/users/:userId を呼び出すこと', async () => {
      const userId = 'auth0|123';

      (axios.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
      });

      await adminUserApi.delete(userId);

      expect(axios.delete).toHaveBeenCalledWith(
        `/api/v1/admin/users/${userId}`
      );
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      const userId = 'auth0|123';

      (axios.delete as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Delete failed')
      );

      await expect(adminUserApi.delete(userId)).rejects.toThrow(
        'Delete failed'
      );
    });
  });
});
