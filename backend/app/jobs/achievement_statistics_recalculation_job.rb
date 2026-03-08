# frozen_string_literal: true

class AchievementStatisticsRecalculationJob < ApplicationJob
  queue_as :default

  def perform
    today = Date.current
    current_week_start = today.beginning_of_week
    current_month_start = today.beginning_of_month

    RoutineTask.where(is_active: true).find_each do |routine_task|
      UpdateAchievementStatisticsJob.perform_later(routine_task.id, 'weekly', current_week_start)
      UpdateAchievementStatisticsJob.perform_later(routine_task.id, 'monthly', current_month_start)
    end
  end
end
