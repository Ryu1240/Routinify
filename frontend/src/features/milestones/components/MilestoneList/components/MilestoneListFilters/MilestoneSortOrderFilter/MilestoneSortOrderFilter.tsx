import React from 'react';
import { Select } from '@mantine/core';
import { MilestoneFilters } from '@/types/milestone';

type MilestoneSortOrderFilterProps = {
  value: MilestoneFilters['sortOrder'];
  onChange: (value: MilestoneFilters['sortOrder']) => void;
};

export const MilestoneSortOrderFilter: React.FC<
  MilestoneSortOrderFilterProps
> = ({ value, onChange }) => {
  return (
    <Select
      label="順序"
      placeholder="降順"
      data={[
        { value: 'desc', label: '降順' },
        { value: 'asc', label: '昇順' },
      ]}
      value={value || 'desc'}
      onChange={(selectedValue) =>
        onChange((selectedValue as MilestoneFilters['sortOrder']) || 'desc')
      }
    />
  );
};
