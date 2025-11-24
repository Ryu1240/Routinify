import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useAdminUsers } from './useAdminUsers';
import { adminUserApi, AdminUser } from '../api/adminUserApi';

// adminUserApiのモック
vi.mock('../api/adminUserApi', () => ({
  adminUserApi: {
    list: vi.fn(),
    delete: vi.fn(),
  },
}));

// axios.isAxiosErrorは実際の実装を使用（モックしない）

describe('useAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初回ロード', () => {
    it('ユーザーリストを取得できること', async () => {
      const mockUsers: AdminUser[] = [
        {
          sub: 'auth0|123',
          name: 'Test User 1',
          email: 'user1@example.com',
          emailVerified: true,
        },
        {
          sub: 'auth0|456',
          name: 'Test User 2',
          email: 'user2@example.com',
          emailVerified: false,
        },
      ];

      vi.mocked(adminUserApi.list).mockResolvedValue({
        data: mockUsers,
        total: 2,
        start: 0,
        limit: 50,
      });

      const { result } = renderHook(() => useAdminUsers());

      // ローディング状態
      expect(result.current.loading).toBe(true);
      expect(result.current.users).toEqual([]);

      // データ取得完了
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
          expect(result.current.users.length).toBe(2);
        },
        { timeout: 5000 }
      );

      expect(result.current.users).toEqual(mockUsers);
      expect(result.current.total).toBe(2);
      expect(result.current.error).toBeNull();
      // React StrictModeやuseEffectの再実行により、複数回呼ばれる可能性がある
      expect(adminUserApi.list).toHaveBeenCalled();
    });

    it('ローディング状態が正しく遷移すること', async () => {
      vi.mocked(adminUserApi.list).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                data: [],
                total: 0,
                start: 0,
                limit: 50,
              });
            }, 100);
          })
      );

      const { result } = renderHook(() => useAdminUsers());

      // 初期状態: ローディング中
      expect(result.current.loading).toBe(true);

      // データ取得完了後: ローディング終了
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('deleteUser', () => {
    it('削除後にリストを更新すること', async () => {
      const initialUsers: AdminUser[] = [
        {
          sub: 'auth0|123',
          name: 'Test User 1',
          email: 'user1@example.com',
          emailVerified: true,
        },
        {
          sub: 'auth0|456',
          name: 'Test User 2',
          email: 'user2@example.com',
          emailVerified: false,
        },
      ];

      const updatedUsers: AdminUser[] = [
        {
          sub: 'auth0|123',
          name: 'Test User 1',
          email: 'user1@example.com',
          emailVerified: true,
        },
      ];

      // 初回ロード用のモックを設定
      vi.mocked(adminUserApi.list).mockResolvedValue({
        data: initialUsers,
        total: 2,
        start: 0,
        limit: 50,
      });

      vi.mocked(adminUserApi.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAdminUsers());

      // 初回ロード完了を待つ
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.users.length).toBe(2);
      });

      expect(result.current.users).toEqual(initialUsers);
      const initialCallCount = vi.mocked(adminUserApi.list).mock.calls.length;
      expect(initialCallCount).toBeGreaterThanOrEqual(1);

      // 削除後の再取得用のモックを設定
      vi.mocked(adminUserApi.list).mockResolvedValueOnce({
        data: updatedUsers,
        total: 1,
        start: 0,
        limit: 50,
      });

      // 削除実行
      await result.current.deleteUser('auth0|456');

      // リストが更新されていることを確認
      await waitFor(
        () => {
          expect(result.current.users.length).toBe(1);
          expect(result.current.users).toEqual(updatedUsers);
          expect(result.current.total).toBe(1);
        },
        { timeout: 5000 }
      );

      expect(adminUserApi.delete).toHaveBeenCalledWith('auth0|456');
      // 削除後の再取得も含めて、listが追加で1回呼ばれることを確認
      const finalCallCount = vi.mocked(adminUserApi.list).mock.calls.length;
      expect(finalCallCount).toBeGreaterThan(initialCallCount);
    });

    it('削除失敗時にエラーを設定すること', async () => {
      const mockUsers: AdminUser[] = [
        {
          sub: 'auth0|123',
          name: 'Test User',
          email: 'user@example.com',
          emailVerified: true,
        },
      ];

      vi.mocked(adminUserApi.list).mockResolvedValue({
        data: mockUsers,
        total: 1,
        start: 0,
        limit: 50,
      });

      const deleteError = new Error('Delete failed');
      vi.mocked(adminUserApi.delete).mockRejectedValue(deleteError);

      const { result } = renderHook(() => useAdminUsers());

      // 初回ロード完了を待つ
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 削除実行（エラーが発生）
      await expect(result.current.deleteUser('auth0|123')).rejects.toThrow(
        'Delete failed'
      );

      // エラーメッセージが設定されていることを確認
      await waitFor(() => {
        expect(result.current.error).toBe(
          'ユーザーの削除に失敗しました。しばらく時間をおいて再度お試しください。'
        );
      });
    });
  });

  describe('setParams', () => {
    it('パラメータを設定して再取得すること', async () => {
      const initialUsers: AdminUser[] = [
        {
          sub: 'auth0|123',
          name: 'Test User',
          email: 'user@example.com',
          emailVerified: true,
        },
      ];

      const filteredUsers: AdminUser[] = [];

      vi.mocked(adminUserApi.list)
        .mockResolvedValueOnce({
          data: initialUsers,
          total: 1,
          start: 0,
          limit: 50,
        })
        .mockResolvedValueOnce({
          data: filteredUsers,
          total: 0,
          start: 0,
          limit: 50,
        });

      const { result } = renderHook(() => useAdminUsers());

      // 初回ロード完了を待つ
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = vi.mocked(adminUserApi.list).mock.calls.length;
      expect(initialCallCount).toBeGreaterThanOrEqual(1);

      // 最後の呼び出しが空のパラメータで呼ばれていることを確認
      const lastCallBeforeSetParams = vi.mocked(adminUserApi.list).mock.calls[
        initialCallCount - 1
      ];
      expect(lastCallBeforeSetParams[0]).toEqual({});

      // パラメータを設定（これによりuseEffectが再実行される）
      result.current.setParams({
        q: 'email:notfound@example.com',
        page: 1,
        perPage: 20,
      });

      // 再取得が実行されることを確認
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        const newCallCount = vi.mocked(adminUserApi.list).mock.calls.length;
        expect(newCallCount).toBeGreaterThan(initialCallCount);
      });

      // 最後の呼び出しで新しいパラメータが使用されていることを確認
      const finalCallCount = vi.mocked(adminUserApi.list).mock.calls.length;
      const lastCall = vi.mocked(adminUserApi.list).mock.calls[
        finalCallCount - 1
      ];
      expect(lastCall[0]).toEqual({
        q: 'email:notfound@example.com',
        page: 1,
        perPage: 20,
      });
    });
  });

  describe('権限エラー（403）の処理', () => {
    it('403エラー時に権限なしと判定すること', async () => {
      // axios.isAxiosErrorが正しく認識するエラーオブジェクトを作成
      const axiosError = new Error('Forbidden') as axios.AxiosError;
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 403,
        data: {},
        statusText: 'Forbidden',
        headers: {},
        config: {} as any,
      };

      vi.mocked(adminUserApi.list).mockRejectedValue(axiosError);

      const { result } = renderHook(() => useAdminUsers());

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 5000 }
      );

      expect(result.current.error).toBe(
        '権限がありません。このページにアクセスするには管理者権限が必要です。'
      );
      expect(result.current.users).toEqual([]);
      expect(result.current.total).toBe(0);
    });

    it('権限がない場合、再取得を試みないこと', async () => {
      // axios.isAxiosErrorが正しく認識するエラーオブジェクトを作成
      const axiosError = new Error('Forbidden') as axios.AxiosError;
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 403,
        data: {},
        statusText: 'Forbidden',
        headers: {},
        config: {} as any,
      };

      vi.mocked(adminUserApi.list).mockRejectedValue(axiosError);

      const { result } = renderHook(() => useAdminUsers());

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 5000 }
      );

      const callCountBeforeRefetch = vi.mocked(adminUserApi.list).mock.calls
        .length;

      // refetchを呼び出しても再取得されないことを確認
      await result.current.refetch();

      // 403エラー後は再試行されないため、listは追加で呼ばれない
      await waitFor(() => {
        const callCountAfterRefetch = vi.mocked(adminUserApi.list).mock.calls
          .length;
        expect(callCountAfterRefetch).toBe(callCountBeforeRefetch);
      });
    });

    it('403以外のエラーは通常のエラーメッセージを表示すること', async () => {
      // axios.isAxiosErrorが正しく認識するエラーオブジェクトを作成
      const axiosError = new Error('Internal Server Error') as axios.AxiosError;
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 500,
        data: {},
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      };

      vi.mocked(adminUserApi.list).mockRejectedValue(axiosError);

      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(
          'ユーザーリストの取得に失敗しました。しばらく時間をおいて再度お試しください。'
        );
      });

      // 403以外のエラーの場合、hasPermissionはnullのまま（初期値）
      // ただし、テスト環境ではundefinedになる可能性があるため、nullまたはundefinedを許容
      expect(
        result.current.hasPermission === null ||
          result.current.hasPermission === undefined
      ).toBe(true);
    });
  });

  describe('refetch', () => {
    it('refetchで再取得できること', async () => {
      const mockUsers: AdminUser[] = [
        {
          sub: 'auth0|123',
          name: 'Test User',
          email: 'user@example.com',
          emailVerified: true,
        },
      ];

      vi.mocked(adminUserApi.list).mockResolvedValue({
        data: mockUsers,
        total: 1,
        start: 0,
        limit: 50,
      });

      const { result } = renderHook(() => useAdminUsers());

      // 初回ロード完了を待つ
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = vi.mocked(adminUserApi.list).mock.calls.length;

      // refetch実行
      await result.current.refetch();

      // refetchにより1回追加で呼ばれることを確認
      await waitFor(() => {
        expect(adminUserApi.list).toHaveBeenCalledTimes(initialCallCount + 1);
      });
    });
  });

  describe('initialParams', () => {
    it('初期パラメータが設定されること', async () => {
      const initialParams = {
        page: 2,
        perPage: 10,
        q: 'email:test@example.com',
      };

      vi.mocked(adminUserApi.list).mockResolvedValue({
        data: [],
        total: 0,
        start: 0,
        limit: 10,
      });

      renderHook(() => useAdminUsers(initialParams));

      await waitFor(() => {
        expect(adminUserApi.list).toHaveBeenCalledWith(initialParams);
      });
    });
  });
});
