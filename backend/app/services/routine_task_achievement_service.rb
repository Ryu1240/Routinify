class RoutineTaskAchievementService < BaseService
  include RoutineTaskAchievement::PeriodCalculator

  PERIODS = %w[weekly monthly custom].freeze
  ACHIEVEMENT_THRESHOLD = 100.0

  def initialize(routine_task, period:, start_date: nil, end_date: nil)
    @routine_task = routine_task
    @period = period.to_s
    @start_date = start_date&.to_date
    @end_date = end_date&.to_date
  end

  def call
    validate_period!
    calculate_period_dates!

    # 週次・月次かつ現在週・現在月の場合は AchievementStatistic を優先
    cached = fetch_cached_statistic
    if cached
      return ServiceResult.success(data: cached)
    end

    stats = task_statistics
    result = {
      total_count: stats[:total_count],
      completed_count: stats[:completed_count],
      incomplete_count: stats[:incomplete_count],
      overdue_count: stats[:overdue_count],
      achievement_rate: achievement_rate,
      period: @period,
      start_date: @start_date.to_s,
      end_date: @end_date.to_s,
      consecutive_periods_count: consecutive_periods_count,
      average_completion_days: average_completion_days
    }

    # 週次・月次の場合、次回用に非同期で保存をスケジュール
    if %w[weekly monthly].include?(@period)
      UpdateAchievementStatisticsJob.perform_later(@routine_task.id, @period, @start_date)
    end

    ServiceResult.success(data: result)
  rescue ArgumentError => e
    ServiceResult.error(
      errors: [ e.message ],
      status: :unprocessable_entity
    )
  rescue StandardError => e
    log_error(e, { routine_task_id: @routine_task&.id, period: @period })
    ServiceResult.error(
      errors: [ '達成状況の計算に失敗しました' ],
      status: :internal_server_error
    )
  end

  private

  def validate_period!
    unless PERIODS.include?(@period)
      raise ArgumentError, "period must be one of: #{PERIODS.join(', ')}"
    end

    if @period == 'custom' && (@start_date.nil? || @end_date.nil?)
      raise ArgumentError, 'start_date and end_date are required for custom period'
    end
  end

  def calculate_period_dates!
    case @period
    when 'weekly'
      # 週次: 月曜日〜日曜日を1週間として定義
      # start_dateとend_dateが指定されている場合はそれを使用
      # 指定されていない場合は現在の週を使用
      if @start_date.present? && @end_date.present?
        # 指定された期間を使用（既に設定されている）
      else
        # デフォルト: 現在の週の月曜日を開始日、日曜日を終了日とする
        today = Date.current
        @start_date = today.beginning_of_week
        @end_date = today.end_of_week
      end
    when 'monthly'
      # 月次: 1日〜月末を1ヶ月として定義
      # start_dateとend_dateが指定されている場合はそれを使用
      # 指定されていない場合は今月を使用
      if @start_date.present? && @end_date.present?
        # 指定された期間を使用（既に設定されている）
      else
        # デフォルト: 今月の1日を開始日、月末を終了日とする
        today = Date.current
        @start_date = today.beginning_of_month
        @end_date = today.end_of_month
      end
    when 'custom'
      # 特定期間: ユーザー指定の期間（start_date 〜 end_date）
      # start_dateとend_dateは既に設定されている
    end
  end

  # 週次・月次の場合、AchievementStatistic からキャッシュを取得（カスタム期間は対象外）
  def fetch_cached_statistic
    return nil if @period == 'custom'

    stat = AchievementStatistic.find_by(
      routine_task_id: @routine_task.id,
      period_type: @period,
      period_start_date: @start_date
    )
    stat&.to_achievement_stats_hash
  end

  # タスク統計情報を一括で取得（モデルから取得）
  def task_statistics
    @task_statistics ||= @routine_task.task_statistics_in_period(@start_date, @end_date)
  end

  # 達成率計算（モデルから取得、統計情報を再利用）
  def achievement_rate
    @routine_task.achievement_rate_in_period(@start_date, @end_date, stats: task_statistics)
  end

  # 連続達成週数/月数の計算
  # 達成の基準: 達成率100%のみを達成と見なす
  # 最新の週/月から遡って計算
  # その週/月にタスクが1つも生成されていない場合: 未達成として扱い、連続が途切れる
  def consecutive_periods_count
    # カスタム期間の場合は連続達成の計算は意味がないため、0を返す
    return 0 if @period == 'custom'

    count = 0
    current_date = Date.current

    loop do
      period_start, period_end = calculate_period_range(current_date, @period)

      # その期間内のタスク統計を取得
      period_stats = @routine_task.task_statistics_in_period(period_start, period_end)

      # タスクが1つも生成されていない場合: 未達成として扱い、連続が途切れる
      break if period_stats[:total_count].zero?

      # 達成率を計算（統計情報を再利用してクエリを削減）
      achievement_rate = @routine_task.achievement_rate_in_period(period_start, period_end, stats: period_stats)

      # 達成率100%の場合のみ達成と見なす
      break unless achievement_rate >= ACHIEVEMENT_THRESHOLD

      count += 1

      # 次の期間に遡る
      current_date = move_to_previous_period(current_date, @period)
    end

    count
  end

  # 平均完了日数（モデルから取得）
  def average_completion_days
    @routine_task.average_completion_days_in_period(@start_date, @end_date)
  end
end
