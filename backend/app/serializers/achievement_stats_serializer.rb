class AchievementStatsSerializer < BaseSerializer
  def as_json
    {
      totalCount: @object[:total_count],
      completedCount: @object[:completed_count],
      incompleteCount: @object[:incomplete_count],
      overdueCount: @object[:overdue_count],
      achievementRate: @object[:achievement_rate],
      period: @object[:period],
      startDate: @object[:start_date],
      endDate: @object[:end_date],
      consecutivePeriodsCount: @object[:consecutive_periods_count],
      averageCompletionDays: @object[:average_completion_days]
    }
  end
end
