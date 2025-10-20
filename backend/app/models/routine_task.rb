class RoutineTask < ApplicationRecord
  has_many :tasks, dependent: :nullify
  belongs_to :category, optional: true

  FREQUENCIES = %w[daily weekly monthly custom].freeze
  PRIORITIES = %w[low medium high].freeze

  validates :account_id, presence: true
  validates :title, presence: true, length: { maximum: 255 }
  validates :frequency, presence: true, inclusion: { in: FREQUENCIES }
  validates :interval_value, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :next_generation_at, presence: true
  validates :max_active_tasks, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :priority, inclusion: { in: PRIORITIES }, allow_nil: true
  validate :interval_value_required_for_custom_frequency

  scope :by_account, ->(account_id) { where(account_id: account_id) }

  # ユーザーIDに紐づく習慣タスクを取得
  def self.for_user(user_id)
    by_account(user_id)
  end

  private

  def interval_value_required_for_custom_frequency
    return unless frequency == 'custom' && interval_value.to_i < 1

    errors.add(:interval_value, 'は custom frequency の場合、1以上である必要があります')
  end
end
