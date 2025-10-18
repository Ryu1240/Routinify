import React from 'react';
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
import { COLORS } from '../../../../constants/colors';
import { Category } from '../../../../types/category';
import { CategoryTable } from '../../../../components/categories/CategoryTable/index';

type CategoryListProps = {
  isAuthenticated: boolean;
  authLoading: boolean;
  categories: Category[];
  loading: boolean;
  error: string | null;
  onEdit: (categoryId: number) => void;
  onDelete: (categoryId: number) => void;
  onAddCategory: () => void;
};

export const CategoryList: React.FC<CategoryListProps> = ({
  isAuthenticated,
  authLoading,
  categories,
  loading,
  error,
  onEdit,
  onDelete,
  onAddCategory,
}) => {
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
          onClick={onAddCategory}
          color={COLORS.PRIMARY}
          variant="filled"
        >
          カテゴリ追加
        </Button>
      </Group>

      <CategoryTable
        categories={categories}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {categories.length > 0 && (
        <Text size="sm" c={COLORS.GRAY} ta="center" mt="sm">
          {categories.length}件のカテゴリを表示中
        </Text>
      )}
    </Container>
  );
};
