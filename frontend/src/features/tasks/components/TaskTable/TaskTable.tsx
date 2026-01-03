import React from 'react';
import { DataTable } from '@/shared/components/DataTable/index';
import { TaskTableProps } from './types';
import { Category, CreateCategoryDto } from '@/types/category';
import { Milestone } from '@/types/milestone';
import { TaskStatus } from '@/types/task';
import { TaskEditableRow } from './TaskEditableRow';
import { TaskTableRow } from './TaskTableRow';
import { createTableColumns } from './taskTableColumns';

type ExtendedTaskTableProps = TaskTableProps & {
  categories?: Category[];
  onCreateCategory?: (categoryData: CreateCategoryDto) => Promise<void>;
  createCategoryLoading?: boolean;
  milestones?: Milestone[];
  taskMilestoneMap?: Map<number, number[]>; // タスクID -> マイルストーンIDの配列のマップ
  onOpenMilestoneModal?: (taskId: number) => void;
  onToggleStatus?: (
    taskId: number,
    currentStatus: TaskStatus | null
  ) => Promise<void>;
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
  milestones = [],
  taskMilestoneMap,
  onOpenMilestoneModal,
  onToggleStatus,
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
      <DataTable.Tbody emptyMessage="タスクがありません" colSpan={8}>
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
                milestones={milestones}
                taskMilestoneIds={taskMilestoneMap?.get(task.id) ?? []}
                onOpenMilestoneModal={onOpenMilestoneModal}
                onToggleStatus={onToggleStatus}
              />
            )}
          </DataTable.Tr>
        ))}
      </DataTable.Tbody>
    </DataTable>
  );
};
