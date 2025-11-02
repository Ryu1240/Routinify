class RoutineTaskAchievementService
  PERIODS = %w[weekly monthly custom].freeze
  ACHIEVEMENT_THRESHOLD = 100.0

  def initialize(routine_task, period:, start_date: nil, end_date: nil)
    @routine_task = routine_task
    @period = period.to_s
    @start_date = start_date&.to_date
    @end_date = end_date&.to_date

    validate_period!
    calculate_period_dates!
  end

  # 達成状況を計算
  def calculate
    {
      total_count: total_count,
      completed_count: completed_count,
      incomplete_count: incomplete_count,
      overdue_count: overdue_count,
      achievement_rate: achievement_rate,
      period: @period,
      start_date: @start_date,
      end_date: @end_date,
      consecutive_periods_count: consecutive_periods_count,
      average_completion_days: average_completion_days
    }
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
      # 現在の週の月曜日を開始日、日曜日を終了日とする
      today = Date.current
      @start_date = today.beginning_of_week
      @end_date = today.end_of_week
    when 'monthly'
      # 月次: 1日〜月末を1ヶ月として定義
      today = Date.current
      @start_date = today.beginning_of_month
      @end_date = today.end_of_month
    when 'custom'
      # 特定期間: ユーザー指定の期間（start_date 〜 end_date）
      # start_dateとend_dateは既に設定されている
    end
  end

  # 期間内のタスクを取得（削除されたタスクも含む）
  def tasks_in_period
    @tasks_in_period ||= @routine_task.tasks_with_deleted
                                      .where(generated_at: @start_date.beginning_of_day..@end_date.end_of_day)
  end

  # 総タスク数: 期間内にgenerated_atが設定されたタスク数（削除されたタスクも含む）
  def total_count
    tasks_in_period.count
  end

  # 完了タスク数: status = 'completed'のタスク数
  def completed_count
    tasks_in_period.where(status: 'completed').count
  end

  # 未完了タスク数: status = 'pending', 'in_progress', 'on_hold'を未達成として集計
  def incomplete_count
    tasks_in_period.where(status: %w[pending in_progress on_hold]).count
  end

  # 期限超過タスク数
  def overdue_count
    tasks_in_period.where('due_date < ?', Time.current).count
  end

  # 達成率計算
  # 達成率 = (完了タスク数 / 総タスク数) × 100
  # タスクが1つも生成されていない場合: 達成率 = 0%
  def achievement_rate
    return 0.0 if total_count.zero?

    (completed_count.to_f / total_count * 100).round(2)
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
      period_start, period_end = calculate_period_range(current_date)

      # その期間内のタスクを取得
      period_tasks = @routine_task.tasks_with_deleted
                                  .where(generated_at: period_start.beginning_of_day..period_end.end_of_day)

      # タスクが1つも生成されていない場合: 未達成として扱い、連続が途切れる
      break if period_tasks.count.zero?

      # 達成率を計算
      completed = period_tasks.where(status: 'completed').count
      total = period_tasks.count
      achievement_rate = total.zero? ? 0.0 : (completed.to_f / total * 100).round(2)

      # 達成率100%の場合のみ達成と見なす
      break unless achievement_rate >= ACHIEVEMENT_THRESHOLD

      count += 1

      # 次の期間に遡る
      current_date = move_to_previous_period(current_date)
    end

    count
  end

  # 指定された日付が含まれる期間の開始日と終了日を計算
  def calculate_period_range(date)
    case @period
    when 'weekly'
      [ date.beginning_of_week, date.end_of_week ]
    when 'monthly'
      [ date.beginning_of_month, date.end_of_month ]
    else
      # このメソッドはweekly/monthlyの場合のみ呼ばれる
      raise ArgumentError, "Invalid period for calculate_period_range: #{@period}"
    end
  end

  # 前の期間に移動
  def move_to_previous_period(date)
    case @period
    when 'weekly'
      date - 1.week
    when 'monthly'
      date - 1.month
    else
      # このメソッドはweekly/monthlyの場合のみ呼ばれる
      raise ArgumentError, "Invalid period for move_to_previous_period: #{@period}"
    end
  end

  # 平均完了日数（完了したタスクのgenerated_atからcompleted_atまでの平均日数）
  # 注意: Taskモデルにcompleted_atカラムがない場合は、updated_atを使用
  def average_completion_days
    completed_tasks = tasks_in_period.where(status: 'completed').to_a
    return 0.0 if completed_tasks.empty?

    total_days = completed_tasks.sum do |task|
      if task.generated_at.present?
        completion_time = task.updated_at # completed_atがないためupdated_atを使用
        ((completion_time - task.generated_at) / 1.day).round(2)
      else
        0
      end
    end

    (total_days.to_f / completed_tasks.count).round(2)
  end
end
