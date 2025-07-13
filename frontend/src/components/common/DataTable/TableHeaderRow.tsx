import React from 'react';
import { Table as MantineTable } from '@mantine/core';
import { TableColumn } from './types';
import { TableHeaderCell } from './TableHeaderCell';

interface TableHeaderRowProps {
  columns: TableColumn[];
  sortBy: string | null;
  reverseSortDirection: boolean;
  onSort: (key: string) => void;
}

export const TableHeaderRow: React.FC<TableHeaderRowProps> = ({ 
  columns, 
  sortBy, 
  reverseSortDirection, 
  onSort 
}) => {
  return (
    <MantineTable.Tr>
      {columns.map((column) => (
        <TableHeaderCell
          key={column.key}
          sorted={column.sortable && sortBy === column.key 
            ? (reverseSortDirection ? 'desc' : 'asc') 
            : null}
          onSort={column.sortable ? () => onSort(column.key) : undefined}
          isActionHeader={column.isAction}
        >
          {column.label}
        </TableHeaderCell>
      ))}
    </MantineTable.Tr>
  );
}; 