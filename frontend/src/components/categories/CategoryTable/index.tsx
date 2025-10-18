import React from 'react';
import { DataTable } from '../../common/DataTable/index';
import { Category } from '../../../types/category';
import { CategoryTableRow } from './CategoryTableRow';

const categoryColumns = [
  { key: 'name', label: 'カテゴリ名', sortable: true },
  { key: 'createdAt', label: '作成日', sortable: true },
  { key: 'updatedAt', label: '更新日', sortable: true },
  { key: 'actions', label: '操作', isAction: true },
];

interface CategoryTableProps {
  categories: Category[];
  onEdit: (categoryId: number) => void;
  onDelete: (categoryId: number) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  onEdit,
  onDelete,
}) => {
  return (
    <DataTable>
      <DataTable.Thead>
        <DataTable.HeaderRow
          columns={categoryColumns}
          sortBy={null}
          reverseSortDirection={false}
          onSort={() => {}}
        />
      </DataTable.Thead>
      <DataTable.Tbody emptyMessage="カテゴリがありません" colSpan={4}>
        {categories.map((category) => (
          <DataTable.Tr key={category.id}>
            <CategoryTableRow
              category={category}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </DataTable.Tr>
        ))}
      </DataTable.Tbody>
    </DataTable>
  );
};
