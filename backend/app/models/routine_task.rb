class RoutineTask < ApplicationRecord
  has_many :tasks, dependent: :nullify
  belongs_to :category, optional: true

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

  private

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
