class Milestone < ApplicationRecord
  include AccountScoped

  has_many :milestone_tasks, dependent: :destroy
  has_many :tasks, through: :milestone_tasks

  validates :name, presence: true, length: { maximum: 255 }
  validates :account_id, presence: true
  validates :status, inclusion: { in: %w[planning in_progress completed cancelled] }, allow_nil: false

  scope :by_account, ->(account_id) { where(account_id: account_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :active, -> { where(status: %w[planning in_progress]) }
  scope :completed, -> { where(status: 'completed') }

  def planning?
    status == 'planning'
  end

  def in_progress?
    status == 'in_progress'
  end

  def completed?
    status == 'completed'
  end

  def cancelled?
    status == 'cancelled'
  end

  def total_tasks_count
    tasks.count
  end

  def completed_tasks_count
    tasks.where(status: 'completed').count
  end

  def progress_percentage
    return 0 if total_tasks_count.zero?

    (completed_tasks_count.to_f / total_tasks_count * 100).round
  end
end

