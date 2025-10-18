import { useFetchCategories } from '../features/categories/hooks/useFetchCategories';
import { useCategoryMutations } from '../features/categories/hooks/useCategoryMutations';

/**
 * Composer hook that combines all category-related hooks
 * カテゴリ一覧とCRUD操作を管理するフック
 */
export const useCategories = () => {
  // データ取得
  const { categories, loading, error, refreshCategories } =
    useFetchCategories();

  // CRUD操作
  const {
    createCategory,
    updateCategory,
    deleteCategory,
    createLoading,
    updateLoading,
    deleteLoading,
    error: mutationError,
  } = useCategoryMutations(refreshCategories);

  return {
    categories,
    loading,
    createLoading,
    updateLoading,
    deleteLoading,
    error: error || mutationError,
    refreshCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
