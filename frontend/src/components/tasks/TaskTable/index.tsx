import React from 'react';
import { DataTable } from '../../common/DataTable/index';
import { TaskTableProps } from './types';
import { Category, CreateCategoryDto } from '../../../types/category';
import { TaskEditableRow } from './TaskEditableRow';
import { TaskTableRow } from './TaskTableRow';
import { createTableColumns } from './taskTableColumns';

type ExtendedTaskTableProps = TaskTableProps & {
  categories?: Category[];
  onCreateCategory?: (categoryData: CreateCategoryDto) => Promise<void>;
  createCategoryLoading?: boolean;
};

export const TaskTable: React.FC<ExtendedTaskTableProps> = ({
  tasks,
  sortBy,
  reverseSortDirection,
  onSort,
  editingTaskId,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  categories = [],
  onCreateCategory,
  createCategoryLoading = false,
}) => {
  const tableColumns = createTableColumns(categories);

  return (
    <DataTable>
      <DataTable.Thead>
        <DataTable.HeaderRow
          columns={tableColumns}
          sortBy={sortBy}
          reverseSortDirection={reverseSortDirection}
          onSort={onSort}
        />
      </DataTable.Thead>
      <DataTable.Tbody emptyMessage="タスクがありません" colSpan={7}>
        {tasks.map((task) => (
          <DataTable.Tr key={task.id}>
            {editingTaskId === task.id ? (
              <TaskEditableRow
                task={task}
                onSave={onSave}
                onCancel={onCancel}
                categories={categories}
                onCreateCategory={onCreateCategory}
                createCategoryLoading={createCategoryLoading}
              />
            ) : (
              <TaskTableRow
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                categories={categories}
              />
            )}
          </DataTable.Tr>
        ))}
      </DataTable.Tbody>
    </DataTable>
  );
};
