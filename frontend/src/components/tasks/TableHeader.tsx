import React from 'react';
import { Table, Group, Text, ActionIcon } from '@mantine/core';
import { IconSortAscending, IconSortDescending } from '@tabler/icons-react';
import { COLORS } from '../../constants/colors';

interface TableHeaderProps {
  children: React.ReactNode;
  sorted?: 'asc' | 'desc' | null;
  onSort?: () => void;
  isActionHeader?: boolean;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, sorted, onSort, isActionHeader }) => {
  const Icon = sorted === 'asc' ? IconSortAscending : IconSortDescending;
  
  return (
    <Table.Th>
      <Group justify={isActionHeader ? "center" : "space-between"}>
        <Text fw={500} fz="sm">
          {children}
        </Text>
        {sorted !== null && sorted !== undefined && onSort && (
          <ActionIcon size="sm" variant="subtle" color={COLORS.PRIMARY} onClick={onSort}>
            <Icon size={16} />
          </ActionIcon>
        )}
      </Group>
    </Table.Th>
  );
}; 