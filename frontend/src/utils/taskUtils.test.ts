import { describe, it, expect } from 'vitest'
import { getPriorityColor, getStatusColor, getCategoryColor, formatDate } from './taskUtils'
import { COLORS } from '../constants/colors'

describe('taskUtils', () => {
  describe('getPriorityColor', () => {
    it('returns correct color for high priority', () => {
      expect(getPriorityColor('high')).toBe(COLORS.PRIMARY)
      expect(getPriorityColor('HIGH')).toBe(COLORS.PRIMARY)
    })

    it('returns correct color for medium priority', () => {
      expect(getPriorityColor('medium')).toBe(COLORS.MEDIUM)
      expect(getPriorityColor('MEDIUM')).toBe(COLORS.MEDIUM)
    })

    it('returns correct color for low priority', () => {
      expect(getPriorityColor('low')).toBe(COLORS.LIGHT)
      expect(getPriorityColor('LOW')).toBe(COLORS.LIGHT)
    })

    it('returns gray color for unknown priority', () => {
      expect(getPriorityColor('unknown')).toBe(COLORS.GRAY)
      expect(getPriorityColor(null)).toBe(COLORS.GRAY)
      expect(getPriorityColor(undefined as any)).toBe(COLORS.GRAY)
    })
  })

  describe('getStatusColor', () => {
    it('returns correct color for completed status', () => {
      expect(getStatusColor('completed')).toBe(COLORS.PRIMARY)
      expect(getStatusColor('COMPLETED')).toBe(COLORS.PRIMARY)
    })

    it('returns correct color for in_progress status', () => {
      expect(getStatusColor('in_progress')).toBe(COLORS.MEDIUM)
      expect(getStatusColor('IN_PROGRESS')).toBe(COLORS.MEDIUM)
    })

    it('returns correct color for pending status', () => {
      expect(getStatusColor('pending')).toBe(COLORS.LIGHT)
      expect(getStatusColor('PENDING')).toBe(COLORS.LIGHT)
    })

    it('returns correct color for cancelled status', () => {
      expect(getStatusColor('cancelled')).toBe(COLORS.GRAY)
      expect(getStatusColor('CANCELLED')).toBe(COLORS.GRAY)
    })

    it('returns gray color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe(COLORS.GRAY)
      expect(getStatusColor(null)).toBe(COLORS.GRAY)
      expect(getStatusColor(undefined as any)).toBe(COLORS.GRAY)
    })
  })

  describe('getCategoryColor', () => {
    it('returns gray color for null category', () => {
      expect(getCategoryColor(null)).toBe(COLORS.GRAY)
    })

    it('returns a color based on category name', () => {
      const brandColors = [COLORS.PRIMARY, COLORS.MEDIUM, COLORS.LIGHT, COLORS.DARK]
      
      // テスト用のカテゴリ名で色が返されることを確認
      const result = getCategoryColor('test')
      expect(brandColors).toContain(result)
    })

    it('returns consistent color for same category', () => {
      const category = 'work'
      const color1 = getCategoryColor(category)
      const color2 = getCategoryColor(category)
      expect(color1).toBe(color2)
    })
  })

  describe('formatDate', () => {
    it('returns formatted date for valid date string', () => {
      const dateString = '2024-01-15'
      const result = formatDate(dateString)
      expect(result).toBe('2024/1/15')
    })

    it('returns dash for null date', () => {
      expect(formatDate(null)).toBe('-')
    })

    it('returns dash for empty string', () => {
      expect(formatDate('')).toBe('-')
    })

    it('handles different date formats', () => {
      const dateString = '2024-12-25T10:30:00Z'
      const result = formatDate(dateString)
      expect(result).toBe('2024/12/25')
    })
  })
}) 