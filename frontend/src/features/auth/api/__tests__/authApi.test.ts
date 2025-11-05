import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from '@/lib/axios';
import { authApi } from '../authApi';

vi.mock('@/lib/axios');

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('Auth0トークンを送信してロール情報を取得する', async () => {
      const auth0Token = 'auth0_token';
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: 'auth0|user123',
              email: 'test@example.com',
              roles: ['admin'],
            },
          },
        },
      };

      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await authApi.login(auth0Token);

      expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/login', {
        auth0_token: auth0Token,
      });
      expect(result).toEqual(mockResponse.data.data);
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      const auth0Token = 'invalid_token';
      (axios.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Invalid token')
      );

      await expect(authApi.login(auth0Token)).rejects.toThrow('Invalid token');
    });
  });

  describe('logout', () => {
    it('ログアウトAPIを呼び出すこと', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {},
      });

      await authApi.logout();

      expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/logout');
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      await expect(authApi.logout()).rejects.toThrow('Network error');
    });
  });

  describe('getCurrentUser', () => {
    it('現在のユーザー情報を取得する', async () => {
      const mockResponse = {
        data: {
          user: {
            id: 'auth0|user123',
            email: 'test@example.com',
            roles: ['admin'],
          },
        },
      };

      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await authApi.getCurrentUser();

      expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/me');
      expect(result).toEqual(mockResponse.data);
    });

    it('エラーが発生した場合、エラーをスローすること', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Unauthorized')
      );

      await expect(authApi.getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });
});
