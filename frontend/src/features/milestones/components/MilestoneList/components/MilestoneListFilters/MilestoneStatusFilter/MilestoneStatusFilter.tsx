import React from 'react';
import { Select } from '@mantine/core';
import { MilestoneFilters, MILESTONE_STATUS_LABELS } from '@/types/milestone';

type MilestoneStatusFilterProps = {
  value: MilestoneFilters['status'];
  onChange: (value: MilestoneFilters['status']) => void;
};

export const MilestoneStatusFilter: React.FC<MilestoneStatusFilterProps> = ({
  value,
  onChange,
}) => {
  return (
    <Select
      label="ステータス"
      placeholder="すべて"
      data={[
        { value: '', label: 'すべて' },
        { value: 'planning', label: MILESTONE_STATUS_LABELS.planning },
        {
          value: 'in_progress',
          label: MILESTONE_STATUS_LABELS.in_progress,
        },
        { value: 'completed', label: MILESTONE_STATUS_LABELS.completed },
        { value: 'cancelled', label: MILESTONE_STATUS_LABELS.cancelled },
      ]}
      value={value || ''}
      onChange={(selectedValue) =>
        onChange((selectedValue as MilestoneFilters['status']) || undefined)
      }
      clearable
    />
  );
};
