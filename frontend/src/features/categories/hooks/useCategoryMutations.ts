import { useState } from 'react';
import { CreateCategoryDto, UpdateCategoryDto } from '@/types/category';
import { handleApiError } from '@/shared/utils/apiErrorUtils';
import { categoriesApi } from '../api/categoriesApi';

export const useCategoryMutations = (onRefresh: () => void) => {
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCategory = async (categoryData: CreateCategoryDto) => {
    try {
      setCreateLoading(true);
      setError(null);

      await categoriesApi.create(categoryData);

      // 作成後にカテゴリリストを再取得
      onRefresh();
    } catch (err) {
      handleApiError(err, {
        defaultMessage:
          'カテゴリの作成に失敗しました。しばらく時間をおいて再度お試しください。',
      });
      setError(
        'カテゴリの作成に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setCreateLoading(false);
    }
  };

  const updateCategory = async (
    categoryId: number,
    categoryData: UpdateCategoryDto
  ) => {
    try {
      setUpdateLoading(true);
      setError(null);

      await categoriesApi.update(categoryId, categoryData);

      // 更新後にカテゴリリストを再取得
      onRefresh();
    } catch (err) {
      handleApiError(err, {
        defaultMessage:
          'カテゴリの更新に失敗しました。しばらく時間をおいて再度お試しください。',
      });
      setError(
        'カテゴリの更新に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteCategory = async (categoryId: number) => {
    try {
      setDeleteLoading(true);
      setError(null);

      await categoriesApi.delete(categoryId);

      // 削除後にカテゴリリストを再取得
      onRefresh();
    } catch (err) {
      handleApiError(err, {
        defaultMessage:
          'カテゴリの削除に失敗しました。しばらく時間をおいて再度お試しください。',
      });
      setError(
        'カテゴリの削除に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setDeleteLoading(false);
    }
  };

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    createLoading,
    updateLoading,
    deleteLoading,
    error,
  };
};
