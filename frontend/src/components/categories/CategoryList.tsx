import React, { useState } from 'react';
import {
  Container,
  Loader,
  Alert,
  Button,
  Title,
  Group,
  Text,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { COLORS } from '../../constants/colors';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../hooks/useAuth';
import { CategoryTable } from './CategoryTable/index';
import CreateCategoryModal from './CreateCategoryModal';
import EditCategoryModal from './EditCategoryModal';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  Category,
} from '../../types/category';

const CategoryList: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    categories,
    loading,
    createLoading,
    updateLoading,
    deleteLoading,
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

  if (authLoading || loading) {
    return (
      <Container size="xl" py="xl">
        <Group justify="center">
          <Loader size="lg" color={COLORS.PRIMARY} />
          <Text c={COLORS.MEDIUM}>
            {authLoading ? '認証情報を確認中...' : 'カテゴリを読み込み中...'}
          </Text>
        </Group>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container size="xl" py="xl">
        <Alert title="認証が必要" color={COLORS.PRIMARY} variant="light">
          カテゴリ一覧を表示するにはログインが必要です。
        </Alert>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert title="エラー" color={COLORS.PRIMARY} variant="light">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="lg">
        カテゴリ管理
      </Title>

      <Group justify="flex-end" mb="md">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setIsCreateModalOpen(true)}
          color={COLORS.PRIMARY}
          variant="filled"
        >
          カテゴリ追加
        </Button>
      </Group>

      <CategoryTable
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {categories.length > 0 && (
        <Text size="sm" c={COLORS.GRAY} ta="center" mt="sm">
          {categories.length}件のカテゴリを表示中
        </Text>
      )}

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
    </Container>
  );
};

export default CategoryList;
