import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCategories } from '@/shared/hooks/useCategories';
import { useFetchCategories } from '@/features/categories/hooks/useFetchCategories';
import { useCategoryMutations } from '@/features/categories/hooks/useCategoryMutations';

vi.mock('@/features/categories/hooks/useFetchCategories');
vi.mock('@/features/categories/hooks/useCategoryMutations');

describe('useCategories', () => {
  const mockRefreshCategories = vi.fn();
  const mockCreateCategory = vi.fn();
  const mockUpdateCategory = vi.fn();
  const mockDeleteCategory = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFetchCategories).mockReturnValue({
      categories: [],
      loading: false,
      error: null,
      refreshCategories: mockRefreshCategories,
    });
    vi.mocked(useCategoryMutations).mockReturnValue({
      createCategory: mockCreateCategory,
      updateCategory: mockUpdateCategory,
      deleteCategory: mockDeleteCategory,
      createLoading: false,
      updateLoading: false,
      deleteLoading: false,
      error: null,
    });
  });

  it('useFetchCategories と useCategoryMutations の戻り値を組み合わせて返すこと', () => {
    vi.mocked(useFetchCategories).mockReturnValue({
      categories: [
        {
          id: 1,
          accountId: 'acc-1',
          name: 'Work',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ],
      loading: false,
      error: null,
      refreshCategories: mockRefreshCategories,
    });

    const { result } = renderHook(() => useCategories());

    expect(result.current.categories).toHaveLength(1);
    expect(result.current.categories[0].name).toBe('Work');
    expect(result.current.loading).toBe(false);
    expect(result.current.createLoading).toBe(false);
    expect(result.current.updateLoading).toBe(false);
    expect(result.current.deleteLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.refreshCategories).toBe(mockRefreshCategories);
    expect(result.current.createCategory).toBe(mockCreateCategory);
    expect(result.current.updateCategory).toBe(mockUpdateCategory);
    expect(result.current.deleteCategory).toBe(mockDeleteCategory);
  });

  it('fetch の error と mutation の error のどちらかがあれば error に含めること', () => {
    vi.mocked(useFetchCategories).mockReturnValue({
      categories: [],
      loading: false,
      error: '取得エラー',
      refreshCategories: mockRefreshCategories,
    });

    const { result } = renderHook(() => useCategories());

    expect(result.current.error).toBe('取得エラー');
  });

  it('mutation の error がある場合 error に含めること', () => {
    vi.mocked(useCategoryMutations).mockReturnValue({
      createCategory: mockCreateCategory,
      updateCategory: mockUpdateCategory,
      deleteCategory: mockDeleteCategory,
      createLoading: false,
      updateLoading: false,
      deleteLoading: false,
      error: '作成エラー',
    });

    const { result } = renderHook(() => useCategories());

    expect(result.current.error).toBe('作成エラー');
  });
});
