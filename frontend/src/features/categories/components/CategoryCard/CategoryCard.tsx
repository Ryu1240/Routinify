import React from 'react';
import { Card, Text, Group, ActionIcon, Tooltip, Stack, Divider } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { COLORS } from '@/shared/constants/colors';
import { Category } from '@/types/category';

interface CategoryCardProps {
  category: Category;
  onEdit: (categoryId: number) => void;
  onDelete: (categoryId: number) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="sm">
        {/* ヘッダー: カテゴリ名とアクション */}
        <Group justify="space-between" align="flex-start">
          <Text fw={600} size="lg" style={{ flex: 1 }}>
            {category.name}
          </Text>
          <Group gap="xs">
            <Tooltip label="編集">
              <ActionIcon
                size="sm"
                variant="subtle"
                color={COLORS.PRIMARY}
                onClick={() => onEdit(category.id)}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="削除">
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={() => onDelete(category.id)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <Divider />

        {/* 日付情報 */}
        <Group gap="md" justify="space-between">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              作成日
            </Text>
            <Text size="sm" c={COLORS.GRAY}>
              {formatDate(category.createdAt)}
            </Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              更新日
            </Text>
            <Text size="sm" c={COLORS.GRAY}>
              {formatDate(category.updatedAt)}
            </Text>
          </Stack>
        </Group>
      </Stack>
    </Card>
  );
};

