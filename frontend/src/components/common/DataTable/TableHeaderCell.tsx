import React from 'react';
import { Table as MantineTable, Text } from '@mantine/core';
import { COLORS } from '../../../constants/colors';
import { SortDirection } from './types';

interface TableHeaderCellProps {
  children: React.ReactNode;
  sorted?: SortDirection;
  onSort?: () => void;
  isActionHeader?: boolean;
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ 
  children, 
  sorted, 
  onSort, 
  isActionHeader 
}) => {
  const Icon = sorted === 'asc' ? '↑' : '↓';
  
  return (
    <MantineTable.Th>
      <div style={{ 
        display: 'flex', 
        justifyContent: isActionHeader ? "center" : "space-between",
        alignItems: 'center'
      }}>
        <Text fw={500} fz="sm">
          {children}
        </Text>
        {sorted !== null && sorted !== undefined && onSort && (
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: COLORS.PRIMARY,
              fontSize: '12px'
            }}
            onClick={onSort}
          >
            {Icon}
          </button>
        )}
      </div>
    </MantineTable.Th>
  );
}; 