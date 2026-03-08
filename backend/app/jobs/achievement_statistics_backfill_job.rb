# frozen_string_literal: true

class AchievementStatisticsBackfillJob < ApplicationJob
  queue_as :default

  # 既存のルーティンタスクに対して、現在週・現在月の達成状況統計を作成する
  # デプロイ後に1回実行する移行ジョブ
  def perform
    today = Date.current
    weekly_start = today.beginning_of_week
    monthly_start = today.beginning_of_month

    RoutineTask.find_each do |routine_task|
      UpdateAchievementStatisticsJob.perform_later(routine_task.id, 'weekly', weekly_start)
      UpdateAchievementStatisticsJob.perform_later(routine_task.id, 'monthly', monthly_start)
    end
  end
end
