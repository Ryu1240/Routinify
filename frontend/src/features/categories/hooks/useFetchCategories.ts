import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Category } from '@/types/category';
import { categoriesApi } from '../api/categoriesApi';

export const useFetchCategories = () => {
  const { isAuthenticated, accessToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchCategories();
    } else if (!isAuthenticated) {
      setLoading(false);
      setCategories([]);
      setError(null);
    }
  }, [isAuthenticated, accessToken]);

  const refreshCategories = () => {
    fetchCategories();
  };

  return {
    categories,
    loading,
    error,
    refreshCategories,
  };
};
