import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateToISO,
  formatDateToDisplay,
  formatDateStringToDisplay,
  formatDateRange,
  getWeekRangeDates,
  getWeekRangeStrings,
  getMonthRangeDates,
  getMonthRangeStrings,
} from './dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats date to YYYY-MM-DD format', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('returns null for null input', () => {
      expect(formatDate(null)).toBeNull();
    });

    it('pads single digit month and day with zeros', () => {
      const date = new Date(2024, 0, 5); // January 5, 2024
      expect(formatDate(date)).toBe('2024-01-05');
    });

    it('handles December correctly', () => {
      const date = new Date(2024, 11, 31); // December 31, 2024
      expect(formatDate(date)).toBe('2024-12-31');
    });
  });

  describe('formatDateToISO', () => {
    it('formats date to YYYY-MM-DD format', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      expect(formatDateToISO(date)).toBe('2024-01-15');
    });

    it('pads single digit month and day with zeros', () => {
      const date = new Date(2024, 0, 5); // January 5, 2024
      expect(formatDateToISO(date)).toBe('2024-01-05');
    });

    it('handles December correctly', () => {
      const date = new Date(2024, 11, 31); // December 31, 2024
      expect(formatDateToISO(date)).toBe('2024-12-31');
    });
  });

  describe('formatDateToDisplay', () => {
    it('formats date to YYYY/MM/DD format', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      expect(formatDateToDisplay(date)).toBe('2024/01/15');
    });

    it('pads single digit month and day with zeros', () => {
      const date = new Date(2024, 0, 5); // January 5, 2024
      expect(formatDateToDisplay(date)).toBe('2024/01/05');
    });
  });

  describe('formatDateStringToDisplay', () => {
    it('formats date string to YYYY/MM/DD format', () => {
      expect(formatDateStringToDisplay('2024-01-15')).toBe('2024/01/15');
    });

    it('handles ISO date strings', () => {
      expect(formatDateStringToDisplay('2024-12-31')).toBe('2024/12/31');
    });

    it('pads single digit month and day with zeros', () => {
      expect(formatDateStringToDisplay('2024-01-05')).toBe('2024/01/05');
    });
  });

  describe('formatDateRange', () => {
    it('formats date range correctly', () => {
      const start = new Date(2024, 0, 1);
      const end = new Date(2024, 0, 7);
      expect(formatDateRange(start, end)).toBe('2024/01/01 - 2024/01/07');
    });
  });

  describe('getWeekRangeDates', () => {
    it('returns current week range when offset is 0', () => {
      const { start, end } = getWeekRangeDates(0);
      expect(start).toBeInstanceOf(Date);
      expect(end).toBeInstanceOf(Date);
      expect(start.getDay()).toBe(1); // Monday
      expect(end.getDay()).toBe(0); // Sunday
    });

    it('returns previous week range when offset is -1', () => {
      const currentWeek = getWeekRangeDates(0);
      const previousWeek = getWeekRangeDates(-1);
      expect(previousWeek.end.getTime()).toBeLessThan(
        currentWeek.start.getTime()
      );
    });

    it('returns next week range when offset is 1', () => {
      const currentWeek = getWeekRangeDates(0);
      const nextWeek = getWeekRangeDates(1);
      expect(nextWeek.start.getTime()).toBeGreaterThan(
        currentWeek.end.getTime()
      );
    });

    it('week starts at Monday 00:00:00', () => {
      const { start } = getWeekRangeDates(0);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);
    });

    it('week ends at Sunday 23:59:59.999', () => {
      const { end } = getWeekRangeDates(0);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
      expect(end.getMilliseconds()).toBe(999);
    });
  });

  describe('getWeekRangeStrings', () => {
    it('returns ISO format strings', () => {
      const { start, end } = getWeekRangeStrings(0);
      expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('matches getWeekRangeDates conversion', () => {
      const dates = getWeekRangeDates(0);
      const strings = getWeekRangeStrings(0);
      expect(strings.start).toBe(formatDateToISO(dates.start));
      expect(strings.end).toBe(formatDateToISO(dates.end));
    });
  });

  describe('getMonthRangeDates', () => {
    it('returns current month range when offset is 0', () => {
      const { start, end } = getMonthRangeDates(0);
      expect(start).toBeInstanceOf(Date);
      expect(end).toBeInstanceOf(Date);
      expect(start.getDate()).toBe(1); // First day of month
    });

    it('returns previous month range when offset is -1', () => {
      const currentMonth = getMonthRangeDates(0);
      const previousMonth = getMonthRangeDates(-1);
      expect(previousMonth.end.getTime()).toBeLessThan(
        currentMonth.start.getTime()
      );
    });

    it('returns next month range when offset is 1', () => {
      const currentMonth = getMonthRangeDates(0);
      const nextMonth = getMonthRangeDates(1);
      expect(nextMonth.start.getTime()).toBeGreaterThan(
        currentMonth.end.getTime()
      );
    });

    it('month starts at 1st day 00:00:00', () => {
      const { start } = getMonthRangeDates(0);
      expect(start.getDate()).toBe(1);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);
    });

    it('month ends at last day 23:59:59.999', () => {
      const { end } = getMonthRangeDates(0);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
      expect(end.getMilliseconds()).toBe(999);
    });
  });

  describe('getMonthRangeStrings', () => {
    it('returns ISO format strings', () => {
      const { start, end } = getMonthRangeStrings(0);
      expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('matches getMonthRangeDates conversion', () => {
      const dates = getMonthRangeDates(0);
      const strings = getMonthRangeStrings(0);
      expect(strings.start).toBe(formatDateToISO(dates.start));
      expect(strings.end).toBe(formatDateToISO(dates.end));
    });
  });
});
