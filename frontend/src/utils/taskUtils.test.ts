import { describe, it, expect } from 'vitest';
import {
  getPriorityColor,
  getStatusColor,
  getCategoryColor,
  formatDate,
} from './taskUtils';

describe('taskUtils', () => {
  describe('getPriorityColor', () => {
    it('returns correct color for high priority', () => {
      expect(getPriorityColor('high')).toBe('#1D74AE');
    });

    it('returns correct color for medium priority', () => {
      expect(getPriorityColor('medium')).toBe('#335471');
    });

    it('returns correct color for low priority', () => {
      expect(getPriorityColor('low')).toBe('#5B819B');
    });

    it('returns default color for null priority', () => {
      expect(getPriorityColor(null)).toBe('#929198');
    });

    it('returns default color for unknown priority', () => {
      expect(getPriorityColor('unknown')).toBe('#929198');
    });
  });

  describe('getStatusColor', () => {
    it('returns correct color for completed status', () => {
      expect(getStatusColor('completed')).toBe('#1D74AE');
    });

    it('returns correct color for in_progress status', () => {
      expect(getStatusColor('in_progress')).toBe('#335471');
    });

    it('returns correct color for pending status', () => {
      expect(getStatusColor('pending')).toBe('#5B819B');
    });

    it('returns correct color for cancelled status', () => {
      expect(getStatusColor('cancelled')).toBe('#929198');
    });

    it('returns default color for null status', () => {
      expect(getStatusColor(null)).toBe('#929198');
    });

    it('returns default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('#929198');
    });
  });

  describe('getCategoryColor', () => {
    it('returns color for Work category', () => {
      const color = getCategoryColor('Work');
      expect(['#1D74AE', '#335471', '#5B819B', '#032742']).toContain(color);
    });

    it('returns color for Personal category', () => {
      const color = getCategoryColor('Personal');
      expect(['#1D74AE', '#335471', '#5B819B', '#032742']).toContain(color);
    });

    it('returns default color for null category', () => {
      expect(getCategoryColor(null)).toBe('#929198');
    });

    it('returns consistent color for same category', () => {
      const color1 = getCategoryColor('Work');
      const color2 = getCategoryColor('Work');
      expect(color1).toBe(color2);
    });
  });

  describe('formatDate', () => {
    it('formats valid date string', () => {
      const result = formatDate('2024-12-31');
      expect(result).toMatch(/^\d{4}\/\d{1,2}\/\d{1,2}$/);
    });

    it('returns dash for null date', () => {
      expect(formatDate(null)).toBe('-');
    });

    it('returns dash for empty date string', () => {
      expect(formatDate('')).toBe('-');
    });

    it('handles different date formats', () => {
      const result1 = formatDate('2024-01-01');
      const result2 = formatDate('2024-12-31');
      expect(result1).toMatch(/^\d{4}\/\d{1,2}\/\d{1,2}$/);
      expect(result2).toMatch(/^\d{4}\/\d{1,2}\/\d{1,2}$/);
    });
  });
});
