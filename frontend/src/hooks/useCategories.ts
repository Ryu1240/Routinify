import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../types/category';
import { categoriesApi } from '../features/categories/api/categoriesApi';

export const useCategories = () => {
  const { isAuthenticated, accessToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchCategories();
    } else if (!isAuthenticated) {
      setLoading(false);
      setCategories([]);
      setError(null);
    }
  }, [isAuthenticated, accessToken]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesApi.fetchAll();
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error('カテゴリの取得に失敗しました:', err);
      setError(
        'カテゴリの取得に失敗しました。しばらく時間をおいて再度お試しください。'
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = () => {
    fetchCategories();
  };

  const createCategory = async (categoryData: CreateCategoryDto) => {
    try {
      setCreateLoading(true);
      setError(null);

      await categoriesApi.create(categoryData);

      // 作成後にカテゴリリストを再取得
      await fetchCategories();
    } catch (err) {
      console.error('カテゴリの作成に失敗しました:', err);
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
      await fetchCategories();
    } catch (err) {
      console.error('カテゴリの更新に失敗しました:', err);
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
      await fetchCategories();
    } catch (err) {
      console.error('カテゴリの削除に失敗しました:', err);
      setError(
        'カテゴリの削除に失敗しました。しばらく時間をおいて再度お試しください。'
      );
      throw err;
    } finally {
      setDeleteLoading(false);
    }
  };

  return {
    categories,
    loading,
    createLoading,
    updateLoading,
    deleteLoading,
    error,
    refreshCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
