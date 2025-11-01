import React from 'react';
import { Group, Stack } from '@mantine/core';
import { MilestoneFilters } from '@/types/milestone';
import { MilestoneSearchInput } from './MilestoneSearchInput';
import { MilestoneStatusFilter } from './MilestoneStatusFilter';
import { MilestoneDueDateRangeFilter } from './MilestoneDueDateRangeFilter';
import { MilestoneSortFilter } from './MilestoneSortFilter';
import { MilestoneSortOrderFilter } from './MilestoneSortOrderFilter';

type MilestoneListFiltersProps = {
  filters: MilestoneFilters;
  onFilterChange: (
    key: keyof MilestoneFilters,
    value: MilestoneFilters[keyof MilestoneFilters]
  ) => void;
};

export const MilestoneListFilters: React.FC<MilestoneListFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  return (
    <Stack gap="md" mb="lg">
      <MilestoneSearchInput
        value={filters.search || ''}
        onChange={(value) => onFilterChange('search', value)}
      />

      <Group grow>
        <MilestoneStatusFilter
          value={filters.status}
          onChange={(value) => onFilterChange('status', value)}
        />

        <MilestoneDueDateRangeFilter
          value={filters.dueDateRange}
          onChange={(value) => onFilterChange('dueDateRange', value)}
        />

        <MilestoneSortFilter
          value={filters.sortBy}
          onChange={(value) => onFilterChange('sortBy', value)}
        />

        <MilestoneSortOrderFilter
          value={filters.sortOrder}
          onChange={(value) => onFilterChange('sortOrder', value)}
        />
      </Group>
    </Stack>
  );
};
