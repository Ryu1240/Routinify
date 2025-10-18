import { useState, useEffect } from 'react';
import axios from '../config/axios';
import { useAuth } from './useAuth';
import {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from '../types/category';

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
      const response = await axios.get('/api/v1/categories');
      setCategories(response.data.data);
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

  const createCategory = async (categoryData: CreateCategoryData) => {
    try {
      setCreateLoading(true);
      setError(null);

      await axios.post('/api/v1/categories', {
        category: {
          name: categoryData.name,
        },
      });

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
    categoryData: UpdateCategoryData
  ) => {
    try {
      setUpdateLoading(true);
      setError(null);

      await axios.put(`/api/v1/categories/${categoryId}`, {
        category: {
          name: categoryData.name,
        },
      });

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

      await axios.delete(`/api/v1/categories/${categoryId}`);

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
