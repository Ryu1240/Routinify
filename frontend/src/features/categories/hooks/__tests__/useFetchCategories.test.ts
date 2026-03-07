import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFetchCategories } from '../useFetchCategories';
import { useAuth } from '@/shared/hooks/useAuth';
import { categoriesApi } from '../../api/categoriesApi';
import type { Category } from '@/types/category';

vi.mock('@/shared/hooks/useAuth');
vi.mock('../../api/categoriesApi');

const mockCategories: Category[] = [
  {
    id: 1,
    accountId: 'acc-1',
    name: 'Work',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

describe('useFetchCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      hasAccessToken: true,
      user: null,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('認証済みの場合 categoriesApi.fetchAll を呼び出しカテゴリ一覧を返すこと', async () => {
    vi.mocked(categoriesApi.fetchAll).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useFetchCategories());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(categoriesApi.fetchAll).toHaveBeenCalled();
    expect(result.current.categories).toEqual(mockCategories);
    expect(result.current.error).toBeNull();
  });

  it('認証されていない場合 fetch を呼ばず loading を false にすること', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      hasAccessToken: false,
      user: null,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useFetchCategories());

    expect(result.current.loading).toBe(false);
    expect(result.current.categories).toEqual([]);
    expect(categoriesApi.fetchAll).not.toHaveBeenCalled();
  });

  it('取得に失敗した場合 error を設定すること', async () => {
    vi.mocked(categoriesApi.fetchAll).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useFetchCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(
      'カテゴリの取得に失敗しました。しばらく時間をおいて再度お試しください。'
    );
    expect(result.current.categories).toEqual([]);
  });

  it('refreshCategories を呼ぶと再取得すること', async () => {
    vi.mocked(categoriesApi.fetchAll).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useFetchCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.mocked(categoriesApi.fetchAll).mockResolvedValue([
      ...mockCategories,
      {
        id: 2,
        accountId: 'acc-1',
        name: 'Personal',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ]);

    result.current.refreshCategories();

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(2);
    });

    expect(categoriesApi.fetchAll).toHaveBeenCalledTimes(2);
  });
});
