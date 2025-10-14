import React from 'react';
import { DataTable } from '../../common/DataTable/index';
import { TaskTableProps } from '../definitions';
import { TaskEditableRow } from './TaskEditableRow';
import { TaskTableRow } from './TaskTableRow';
import { tableColumns } from './taskTableColumns';

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  sortBy,
  reverseSortDirection,
  onSort,
  editingTaskId,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}) => {
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
              <TaskEditableRow task={task} onSave={onSave} onCancel={onCancel} />
            ) : (
              <TaskTableRow task={task} onEdit={onEdit} onDelete={onDelete} />
            )}
          </DataTable.Tr>
        ))}
      </DataTable.Tbody>
    </DataTable>
  );
};
