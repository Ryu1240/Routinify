# frozen_string_literal: true

class UpdateAchievementStatisticsJob < ApplicationJob
  queue_as :default

  def perform(routine_task_id, period_type, period_start_date)
    routine_task = RoutineTask.find_by(id: routine_task_id)
    return unless routine_task

    period_start = period_start_date.is_a?(String) ? Date.parse(period_start_date) : period_start_date.to_date
    period_end = case period_type.to_s
    when 'weekly' then period_start.end_of_week
    when 'monthly' then period_start.end_of_month
    else return
    end

    service = RoutineTaskAchievementService.new(
      routine_task,
      period: period_type,
      start_date: period_start,
      end_date: period_end
    )
    result = service.call

    return unless result.success?

    data = result.data
    AchievementStatistic.upsert(
      {
        routine_task_id: routine_task_id,
        period_type: period_type.to_s,
        period_start_date: period_start,
        period_end_date: period_end,
        total_count: data[:total_count],
        completed_count: data[:completed_count],
        incomplete_count: data[:incomplete_count],
        overdue_count: data[:overdue_count],
        achievement_rate: data[:achievement_rate],
        consecutive_periods_count: data[:consecutive_periods_count],
        average_completion_days: data[:average_completion_days],
        calculated_at: Time.current,
        created_at: Time.current,
        updated_at: Time.current
      },
      unique_by: %i[routine_task_id period_type period_start_date]
    )
  end
end
