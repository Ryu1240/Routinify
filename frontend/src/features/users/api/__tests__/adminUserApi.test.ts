import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from '@/lib/axios';
import { adminUserApi, type AdminUser } from '../adminUserApi';

vi.mock('@/lib/axios');

const mockUser: AdminUser = {
  sub: 'auth0|user123',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: true,
};

describe('adminUserApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('GET /api/v1/admin/users を呼び出しユーザー一覧を返すこと', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          data: {
            users: [mockUser],
            total: 1,
            start: 0,
            limit: 20,
          },
        },
      });

      const result = await adminUserApi.list();

      expect(axios.get).toHaveBeenCalledWith('/api/v1/admin/users', {
        params: {},
      });
      expect(result).toEqual({
        data: [mockUser],
        total: 1,
        start: 0,
        limit: 20,
      });
    });

    it('params を camelCase で受け取り per_page 等に変換して送信すること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          data: {
            users: [],
            total: 0,
            start: 20,
            limit: 10,
          },
        },
      });

      await adminUserApi.list({
        page: 2,
        perPage: 10,
        q: 'search',
        sort: 'createdAt',
        order: 'desc',
      });

      expect(axios.get).toHaveBeenCalledWith('/api/v1/admin/users', {
        params: {
          page: 2,
          per_page: 10,
          q: 'search',
          sort: 'createdAt',
          order: 'desc',
        },
      });
    });

    it('data に total/start/limit が無い場合は 0 で返すこと', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          data: {
            users: [mockUser],
          },
        },
      });

      const result = await adminUserApi.list();

      expect(result).toEqual({
        data: [mockUser],
        total: 0,
        start: 0,
        limit: 0,
      });
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
      (axios.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
      });

      await adminUserApi.delete('auth0|user123');

      expect(axios.delete).toHaveBeenCalledWith(
        '/api/v1/admin/users/auth0|user123'
      );
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.delete as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Delete failed')
      );

      await expect(adminUserApi.delete('auth0|user123')).rejects.toThrow(
        'Delete failed'
      );
    });
  });
});
