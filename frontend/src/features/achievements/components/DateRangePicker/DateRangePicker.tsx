import React from 'react';
import { Group } from '@mantine/core';
import { DatesProvider, DatePickerInput } from '@mantine/dates';
import { formatDate } from '@/shared/utils/dateUtils';

export type DateRangePickerProps = {
  startDate: string | null;
  endDate: string | null;
  onDateChange: (startDate: string | null, endDate: string | null) => void;
};

// Mantine 8系ではDatePickerInputのonChangeが文字列またはDateを返す可能性があるため、
// Dateオブジェクトに変換する関数
const toDate = (value: unknown): Date | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  // Mantine 8系では文字列が返される可能性があるため、文字列をDateオブジェクトに変換
  const date = new Date(value as string | number);
  return isNaN(date.getTime()) ? null : date;
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
}) => {
  const parseDate = (dateString: string | null): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  const handleStartDateChange = (value: unknown) => {
    const date = toDate(value);
    const formattedDate = formatDate(date);
    onDateChange(formattedDate, endDate);
  };

  const handleEndDateChange = (value: unknown) => {
    const date = toDate(value);
    const formattedDate = formatDate(date);
    onDateChange(startDate, formattedDate);
  };

  return (
    <DatesProvider settings={{ firstDayOfWeek: 1 }}>
      <Group gap="md" align="flex-end" wrap="nowrap">
        <DatePickerInput
          label="開始日"
          placeholder="開始日を選択"
          value={parseDate(startDate)}
          onChange={handleStartDateChange}
          maxDate={parseDate(endDate) || undefined}
          clearable
          style={{ flex: 1 }}
        />
        <DatePickerInput
          label="終了日"
          placeholder="終了日を選択"
          value={parseDate(endDate)}
          onChange={handleEndDateChange}
          minDate={parseDate(startDate) || undefined}
          clearable
          style={{ flex: 1 }}
        />
      </Group>
    </DatesProvider>
  );
};
