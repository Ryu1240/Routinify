import React from 'react';
import { Table as MantineTable } from '@mantine/core';
import { TableBody } from './TableBody';
import { TableHeaderRow } from './TableHeaderRow';

interface DataTableProps {
  children: React.ReactNode;
  horizontalSpacing?: string;
  verticalSpacing?: string;
  minWidth?: number;
}

export const DataTable: React.FC<DataTableProps> & {
  Thead: typeof MantineTable.Thead;
  Tbody: typeof TableBody;
  HeaderRow: typeof TableHeaderRow;
  Tr: typeof MantineTable.Tr;
  Td: typeof MantineTable.Td;
} = Object.assign(({
  children,
  horizontalSpacing = "md",
  verticalSpacing = "sm",
  minWidth = 700
}: DataTableProps) => {
  return (
    <MantineTable 
      horizontalSpacing={horizontalSpacing} 
      verticalSpacing={verticalSpacing} 
      miw={minWidth}
    >
      {children}
    </MantineTable>
  );
}, {
  Thead: MantineTable.Thead,
  Tbody: TableBody,
  HeaderRow: TableHeaderRow,
  Tr: MantineTable.Tr,
  Td: MantineTable.Td
}); 