import React from 'react';
import { Container, Button, Title, Group, Text, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import { ListPageState } from '@/shared/components';
import { Category } from '@/types/category';
import { CategoryTable } from '@/features/categories/components/CategoryTable';
import { CategoryCard } from '@/features/categories/components/CategoryCard';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';

type CategoryListProps = {
  isAuthenticated: boolean;
  authLoading: boolean;
  categories: Category[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void | Promise<void>;
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
  onRetry,
  onEdit,
  onDelete,
  onAddCategory,
}) => {
  const isMobile = useIsMobile();

  if (authLoading || loading) {
    return (
      <ListPageState
        variant="loading"
        loadingMessage={
          authLoading ? '認証情報を確認中...' : 'カテゴリを読み込み中...'
        }
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <ListPageState
        variant="unauthenticated"
        unauthenticatedMessage="カテゴリ一覧を表示するにはログインが必要です。"
      />
    );
  }

  if (error) {
    return (
      <ListPageState variant="error" errorMessage={error} onRetry={onRetry} />
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

      {isMobile ? (
        categories.length > 0 ? (
          <Stack gap="md">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </Stack>
        ) : (
          <Text ta="center" c={COLORS.GRAY} py="xl">
            カテゴリがありません
          </Text>
        )
      ) : (
        <CategoryTable
          categories={categories}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}

      {categories.length > 0 && (
        <Text size="sm" c={COLORS.GRAY} ta="center" mt="sm">
          {categories.length}件のカテゴリを表示中
        </Text>
      )}
    </Container>
  );
};
