import React from 'react';
import { Text, Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { COLORS } from '@/constants/colors';
import { DataTable } from '@/shared/components/DataTable/index';
import { Category } from '@/types/category';

interface CategoryTableRowProps {
  category: Category;
  onEdit: (categoryId: number) => void;
  onDelete: (categoryId: number) => void;
}

export const CategoryTableRow: React.FC<CategoryTableRowProps> = ({
  category,
  onEdit,
  onDelete,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  return (
    <>
      <DataTable.Td>
        <Text fw={500}>{category.name}</Text>
      </DataTable.Td>
      <DataTable.Td>
        <Text size="sm" c={COLORS.GRAY}>
          {formatDate(category.createdAt)}
        </Text>
      </DataTable.Td>
      <DataTable.Td>
        <Text size="sm" c={COLORS.GRAY}>
          {formatDate(category.updatedAt)}
        </Text>
      </DataTable.Td>
      <DataTable.Td>
        <Group gap="xs" justify="center">
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
      </DataTable.Td>
    </>
  );
};
