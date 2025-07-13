import React from 'react';
import { Table as MantineTable, Text } from '@mantine/core';
import { COLORS } from '../../../constants/colors';

interface TableBodyProps {
  children: React.ReactNode;
  emptyMessage?: string;
  colSpan?: number;
}

export const TableBody: React.FC<TableBodyProps> = ({
  children,
  emptyMessage = 'データがありません',
  colSpan = 1,
}) => {
  return (
    <MantineTable.Tbody>
      {React.Children.count(children) > 0 ? (
        children
      ) : (
        <MantineTable.Tr>
          <MantineTable.Td colSpan={colSpan}>
            <Text ta="center" c={COLORS.GRAY} py="xl">
              {emptyMessage}
            </Text>
          </MantineTable.Td>
        </MantineTable.Tr>
      )}
    </MantineTable.Tbody>
  );
};
