import React, { useState } from 'react';
import { useCategories } from '@/shared/hooks/useCategories';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  Category,
} from '@/types/category';
import { CategoryList } from './CategoryList';
import CreateCategoryModal from '@/components/categories/CreateCategoryModal';
import EditCategoryModal from '@/components/categories/EditCategoryModal';

export const CategoryListContainer: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    categories,
    loading,
    createLoading,
    updateLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleCreate = async (categoryData: CreateCategoryDto) => {
    try {
      await createCategory(categoryData);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('カテゴリ作成に失敗:', error);
    }
  };

  const handleEdit = (categoryId: number) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      setEditingCategory(category);
      setIsEditModalOpen(true);
    }
  };

  const handleUpdate = async (
    categoryId: number,
    categoryData: UpdateCategoryDto
  ) => {
    try {
      await updateCategory(categoryId, categoryData);
      setIsEditModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('カテゴリ更新に失敗:', error);
    }
  };

  const handleDelete = async (categoryId: number) => {
    if (
      window.confirm(
        'このカテゴリを削除してもよろしいですか？\nこのカテゴリに紐づくタスクのカテゴリは解除されます。'
      )
    ) {
      try {
        await deleteCategory(categoryId);
      } catch (error) {
        console.error('カテゴリ削除に失敗:', error);
      }
    }
  };

  return (
    <>
      <CategoryList
        isAuthenticated={isAuthenticated}
        authLoading={authLoading}
        categories={categories}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddCategory={() => setIsCreateModalOpen(true)}
      />

      <CreateCategoryModal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        loading={createLoading}
      />

      <EditCategoryModal
        opened={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleUpdate}
        category={editingCategory}
        loading={updateLoading}
      />
    </>
  );
};
