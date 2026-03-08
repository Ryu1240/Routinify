class RoutineTaskAchievementTrendService < BaseService
  include RoutineTaskAchievement::PeriodCalculator

  PERIODS = %w[weekly monthly].freeze

  def initialize(routine_task, period:, weeks: 4, months: 3)
    @routine_task = routine_task
    @period = period.to_s
    @weeks = weeks.to_i
    @months = months.to_i
  end

  def call
    validate_period!
    trend_data = calculate_trend_data
    ServiceResult.success(data: trend_data)
  rescue ArgumentError => e
    ServiceResult.error(
      errors: [ e.message ],
      status: :unprocessable_entity
    )
  rescue StandardError => e
    log_error(e, { routine_task_id: @routine_task&.id, period: @period })
    ServiceResult.error(
      errors: [ '達成率推移の計算に失敗しました' ],
      status: :internal_server_error
    )
  end

  private

  def validate_period!
    unless PERIODS.include?(@period)
      raise ArgumentError, "period must be one of: #{PERIODS.join(', ')}"
    end
  end

  def calculate_trend_data
    count = @period == 'weekly' ? @weeks : @months
    period_starts = collect_period_starts(count)

    # achievement_statistics から一括取得
    cached = AchievementStatistic
      .where(routine_task_id: @routine_task.id, period_type: @period, period_start_date: period_starts)
      .index_by(&:period_start_date)

    data = period_starts.map do |period_start|
      stat = cached[period_start]
      if stat
        {
          period: period_start.to_s,
          achievementRate: stat.achievement_rate.to_f,
          totalCount: stat.total_count,
          completedCount: stat.completed_count
        }
      else
        period_end = @period == 'weekly' ? period_start.end_of_week : period_start.end_of_month
        period_stats = @routine_task.task_statistics_in_period(period_start, period_end)
        achievement_rate = @routine_task.achievement_rate_in_period(period_start, period_end, stats: period_stats)

        UpdateAchievementStatisticsJob.perform_later(@routine_task.id, @period, period_start)

        {
          period: period_start.to_s,
          achievementRate: achievement_rate,
          totalCount: period_stats[:total_count],
          completedCount: period_stats[:completed_count]
        }
      end
    end

    data.sort_by { |item| item[:period] }
  end

  def collect_period_starts(count)
    period_starts = []
    current_date = Date.current
    count.times do
      period_start, = calculate_period_range(current_date, @period)
      period_starts << period_start
      current_date = move_to_previous_period(current_date, @period)
    end
    period_starts.uniq
  end
end
