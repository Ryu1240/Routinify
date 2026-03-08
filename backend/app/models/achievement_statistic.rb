# frozen_string_literal: true

class AchievementStatistic < ApplicationRecord
  belongs_to :routine_task

  PERIOD_TYPES = %w[weekly monthly].freeze

  validates :routine_task_id, presence: true
  validates :period_type, presence: true, inclusion: { in: PERIOD_TYPES }
  validates :period_start_date, presence: true
  validates :period_end_date, presence: true
  validates :total_count, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :completed_count, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :incomplete_count, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :overdue_count, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :achievement_rate, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :consecutive_periods_count, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :average_completion_days, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :calculated_at, presence: true

  scope :by_period_type, ->(period_type) { where(period_type: period_type) }
  scope :for_period, ->(period_start_date) { where(period_start_date: period_start_date) }
  scope :current_week, -> { by_period_type('weekly').for_period(Date.current.beginning_of_week) }
  scope :current_month, -> { by_period_type('monthly').for_period(Date.current.beginning_of_month) }

  # AchievementStatsSerializer が期待するハッシュ形式に変換
  def to_achievement_stats_hash
    {
      total_count: total_count,
      completed_count: completed_count,
      incomplete_count: incomplete_count,
      overdue_count: overdue_count,
      achievement_rate: achievement_rate.to_f,
      period: period_type,
      start_date: period_start_date.to_s,
      end_date: period_end_date.to_s,
      consecutive_periods_count: consecutive_periods_count,
      average_completion_days: average_completion_days.to_f
    }
  end
end
