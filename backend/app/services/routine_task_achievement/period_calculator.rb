# frozen_string_literal: true

module RoutineTaskAchievement
  # RoutineTask 達成率計算専用の期間計算モジュール。
  # 週次(weekly)・月次(monthly)の期間範囲と前期間への移動を提供する。
  module PeriodCalculator
    PERIODS = %w[weekly monthly].freeze

    # 指定された日付が含まれる期間の開始日と終了日を計算する
    # @param date [Date] 基準日
    # @param period [String] 'weekly' または 'monthly'
    # @return [Array<Date>] [period_start, period_end]
    def calculate_period_range(date, period)
      case period.to_s
      when 'weekly'
        [ date.beginning_of_week, date.end_of_week ]
      when 'monthly'
        [ date.beginning_of_month, date.end_of_month ]
      else
        raise ArgumentError, "Invalid period for calculate_period_range: #{period}"
      end
    end

    # 指定された日付を含む期間の前の期間の開始日を返す
    # @param date [Date] 基準日
    # @param period [String] 'weekly' または 'monthly'
    # @return [Date] 前期間の開始日に相当する日付
    def move_to_previous_period(date, period)
      case period.to_s
      when 'weekly'
        date - 1.week
      when 'monthly'
        date - 1.month
      else
        raise ArgumentError, "Invalid period for move_to_previous_period: #{period}"
      end
    end
  end
end
