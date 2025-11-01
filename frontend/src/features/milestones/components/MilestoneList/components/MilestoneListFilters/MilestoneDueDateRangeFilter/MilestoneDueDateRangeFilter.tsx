import React from 'react';
import { Select } from '@mantine/core';
import { MilestoneFilters, DUE_DATE_RANGE_LABELS } from '@/types/milestone';

type MilestoneDueDateRangeFilterProps = {
  value: MilestoneFilters['dueDateRange'];
  onChange: (value: MilestoneFilters['dueDateRange']) => void;
};

export const MilestoneDueDateRangeFilter: React.FC<
  MilestoneDueDateRangeFilterProps
> = ({ value, onChange }) => {
  return (
    <Select
      label="期限範囲"
      placeholder="すべて"
      data={[
        { value: '', label: 'すべて' },
        { value: 'overdue', label: DUE_DATE_RANGE_LABELS.overdue },
        { value: 'today', label: DUE_DATE_RANGE_LABELS.today },
        { value: 'this_week', label: DUE_DATE_RANGE_LABELS.this_week },
        { value: 'this_month', label: DUE_DATE_RANGE_LABELS.this_month },
      ]}
      value={value || ''}
      onChange={(selectedValue) =>
        onChange(
          (selectedValue as MilestoneFilters['dueDateRange']) || undefined
        )
      }
      clearable
    />
  );
};
