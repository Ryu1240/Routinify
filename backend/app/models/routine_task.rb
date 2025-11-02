class RoutineTask < ApplicationRecord
  has_many :tasks, -> { active }, class_name: 'Task', foreign_key: 'routine_task_id'
  has_many :tasks_with_deleted, class_name: 'Task', foreign_key: 'routine_task_id'
  belongs_to :category, optional: true

  before_destroy :destroy_related_tasks

  FREQUENCIES = %w[daily weekly monthly custom].freeze
  PRIORITIES = %w[low medium high].freeze

  validates :account_id, presence: true
  validates :title, presence: true, length: { maximum: 255 }
  validates :frequency, presence: true, inclusion: { in: FREQUENCIES }
  validates :next_generation_at, presence: true
  validates :start_generation_at, presence: true
  validates :max_active_tasks, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :priority, inclusion: { in: PRIORITIES }, allow_nil: true
  validates :due_date_offset_days, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :due_date_offset_hour, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than: 24 }, allow_nil: true
  validate :validate_interval_value_based_on_frequency
  validate :validate_start_generation_at_immutable

  scope :by_account, ->(account_id) { where(account_id: account_id) }

  # ユーザーIDに紐づく習慣タスクを取得
  def self.for_user(user_id)
    by_account(user_id)
  end

  # 未完了タスクの数をカウント
  def active_tasks_count
    tasks.where.not(status: 'completed').count
  end

  # 頻度に応じた間隔日数を返す
  def interval_days
    case frequency
    when 'daily'
      1
    when 'weekly'
      7
    when 'monthly'
      30
    when 'custom'
      interval_value || 1
    else
      1
    end
  end

  # 現在時刻に基づいて生成すべきタスク数を計算
  def tasks_to_generate_count(current_time = Time.current)
    # 次回生成日時がまだ到来していない場合は0
    return 0 if next_generation_at > current_time

    # 前回生成日時が未設定の場合は1つだけ生成
    return 1 if last_generated_at.nil?

    # 前回生成日時から現在までの経過日数を計算
    days_elapsed = ((current_time - last_generated_at) / 1.day).floor

    # 頻度に応じて生成すべきタスク数を計算
    (days_elapsed.to_f / interval_days).floor.clamp(0, max_active_tasks)
  end

  # 次回生成日時を計算
  def calculate_next_generation_at(base_time = Time.current)
    base_time + interval_days.days
  end

  # 生成済みかどうかをチェック（一度でも生成が行われたか）
  def generated?
    last_generated_at.present?
  end

  # 期限日時を計算（基準日にオフセットを加算）
  # @param base_date [Time, Date] 基準日時（最初のタスクの場合は開始日、2回目以降は生成日時）
  def calculate_due_date(base_date)
    return nil unless base_date

    due_date = base_date.to_date.beginning_of_day

    if due_date_offset_days.present?
      due_date += due_date_offset_days.days
    end

    if due_date_offset_hour.present?
      due_date += due_date_offset_hour.hours
    end

    due_date
  end

  # 期間内のタスクを取得（削除されたタスクも含む）
  # @param start_date [Date] 開始日
  # @param end_date [Date] 終了日
  def tasks_in_period(start_date, end_date)
    tasks_with_deleted.where(generated_at: start_date.beginning_of_day..end_date.end_of_day)
  end

  # 期間内のタスク統計情報を一括で取得（1クエリでレコードを取得し、メモリ上で集計）
  # @param start_date [Date] 開始日
  # @param end_date [Date] 終了日
  # @return [Hash] 統計情報のハッシュ
  def task_statistics_in_period(start_date, end_date)
    # 1クエリで期間内のタスクを全て取得
    tasks = tasks_in_period(start_date, end_date).to_a
    current_time = Time.current

    # メモリ上でステータスごとの集計
    status_counts = tasks.group_by(&:status).transform_values(&:count)

    # メモリ上で期限超過タスク数を計算
    overdue_count = tasks.count { |task| task.due_date && task.due_date < current_time }

    total_count = tasks.count
    completed_count = status_counts['completed'] || 0
    incomplete_count = (status_counts['pending'] || 0) +
                       (status_counts['in_progress'] || 0) +
                       (status_counts['on_hold'] || 0)

    {
      total_count: total_count,
      completed_count: completed_count,
      incomplete_count: incomplete_count,
      overdue_count: overdue_count,
      status_counts: status_counts
    }
  end

  # 期間内の達成率を計算（統計情報を再利用可能）
  # @param start_date [Date] 開始日
  # @param end_date [Date] 終了日
  # @param stats [Hash, nil] 既に計算済みの統計情報（オプション）
  # @return [Float] 達成率（0.0-100.0）
  def achievement_rate_in_period(start_date, end_date, stats: nil)
    stats ||= task_statistics_in_period(start_date, end_date)
    return 0.0 if stats[:total_count].zero?

    (stats[:completed_count].to_f / stats[:total_count] * 100).round(2)
  end

  # 期間内の平均完了日数を計算（pluckを使用して効率化）
  # @param start_date [Date] 開始日
  # @param end_date [Date] 終了日
  # @return [Float] 平均完了日数
  def average_completion_days_in_period(start_date, end_date)
    completed_data = tasks_in_period(start_date, end_date)
                      .where(status: 'completed')
                      .where.not(generated_at: nil)
                      .pluck(:generated_at, :updated_at)

    return 0.0 if completed_data.empty?

    total_days = completed_data.sum do |generated_at, updated_at|
      ((updated_at - generated_at) / 1.day).round(2)
    end

    (total_days.to_f / completed_data.count).round(2)
  end

  private

  def destroy_related_tasks
    # 紐づくタスク（論理削除済み含む）を物理削除
    Task.unscoped.where(routine_task_id: id).delete_all
  end

  def validate_interval_value_based_on_frequency
    if frequency == 'custom'
      if interval_value.blank?
        errors.add(:interval_value, 'はカスタム頻度の場合必須です')
      elsif interval_value.to_i < 1
        errors.add(:interval_value, 'は1以上である必要があります')
      end
    else
      # daily/weekly/monthlyの場合はinterval_valueはNULLであるべき
      # 値が設定されていてもバリデーションエラーにはしない（無視される）
    end
  end

  def validate_start_generation_at_immutable
    # 一度でも生成が行われた場合、start_generation_atは変更不可
    # ただし、新規作成時は変更と判断しない
    if generated? && start_generation_at_changed? && persisted?
      errors.add(:start_generation_at, 'は一度でも生成が行われると変更できません')
    end
  end
end
