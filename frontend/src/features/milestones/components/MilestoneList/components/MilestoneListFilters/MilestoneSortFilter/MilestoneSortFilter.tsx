import React from 'react';
import { Select } from '@mantine/core';
import { MilestoneFilters } from '@/types/milestone';

type MilestoneSortFilterProps = {
  value: MilestoneFilters['sortBy'];
  onChange: (value: MilestoneFilters['sortBy']) => void;
};

export const MilestoneSortFilter: React.FC<MilestoneSortFilterProps> = ({
  value,
  onChange,
}) => {
  return (
    <Select
      label="ソート"
      placeholder="作成日"
      data={[
        { value: 'created_at', label: '作成日' },
        { value: 'due_date', label: '期限日' },
        { value: 'progress', label: '進捗率' },
      ]}
      value={value || 'created_at'}
      onChange={(selectedValue) =>
        onChange((selectedValue as MilestoneFilters['sortBy']) || 'created_at')
      }
    />
  );
};
