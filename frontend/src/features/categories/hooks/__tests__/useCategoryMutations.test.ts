import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCategoryMutations } from '../useCategoryMutations';
import { categoriesApi } from '../../api/categoriesApi';

vi.mock('../../api/categoriesApi');

describe('useCategoryMutations', () => {
  const onRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createCategory が API を呼び出し成功時に onRefresh を呼ぶこと', async () => {
    vi.mocked(categoriesApi.create).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCategoryMutations(onRefresh));

    result.current.createCategory({ name: 'New Category' });

    await waitFor(() => {
      expect(result.current.createLoading).toBe(false);
    });

    expect(categoriesApi.create).toHaveBeenCalledWith({ name: 'New Category' });
    expect(onRefresh).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('createCategory が失敗時に error を設定し err をスローすること', async () => {
    vi.mocked(categoriesApi.create).mockRejectedValue(
      new Error('Create failed')
    );

    const { result } = renderHook(() => useCategoryMutations(onRefresh));

    await expect(
      result.current.createCategory({ name: 'New' })
    ).rejects.toThrow('Create failed');

    await waitFor(() => {
      expect(result.current.createLoading).toBe(false);
      expect(result.current.error).toBe(
        'カテゴリの作成に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('updateCategory が API を呼び出し成功時に onRefresh を呼ぶこと', async () => {
    vi.mocked(categoriesApi.update).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCategoryMutations(onRefresh));

    result.current.updateCategory(1, { name: 'Updated Category' });

    await waitFor(() => {
      expect(result.current.updateLoading).toBe(false);
    });

    expect(categoriesApi.update).toHaveBeenCalledWith(1, {
      name: 'Updated Category',
    });
    expect(onRefresh).toHaveBeenCalled();
  });

  it('updateCategory が失敗時に error を設定し err をスローすること', async () => {
    vi.mocked(categoriesApi.update).mockRejectedValue(
      new Error('Update failed')
    );

    const { result } = renderHook(() => useCategoryMutations(onRefresh));

    await expect(
      result.current.updateCategory(1, { name: 'Updated' })
    ).rejects.toThrow('Update failed');

    await waitFor(() => {
      expect(result.current.updateLoading).toBe(false);
      expect(result.current.error).toBe(
        'カテゴリの更新に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('deleteCategory が API を呼び出し成功時に onRefresh を呼ぶこと', async () => {
    vi.mocked(categoriesApi.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCategoryMutations(onRefresh));

    result.current.deleteCategory(1);

    await waitFor(() => {
      expect(result.current.deleteLoading).toBe(false);
    });

    expect(categoriesApi.delete).toHaveBeenCalledWith(1);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('deleteCategory が失敗時に error を設定し err をスローすること', async () => {
    vi.mocked(categoriesApi.delete).mockRejectedValue(
      new Error('Delete failed')
    );

    const { result } = renderHook(() => useCategoryMutations(onRefresh));

    await expect(result.current.deleteCategory(1)).rejects.toThrow(
      'Delete failed'
    );

    await waitFor(() => {
      expect(result.current.deleteLoading).toBe(false);
      expect(result.current.error).toBe(
        'カテゴリの削除に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });
});
