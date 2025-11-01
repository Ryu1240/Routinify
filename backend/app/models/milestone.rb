class Milestone < ApplicationRecord
  include AccountScoped

  has_many :milestone_tasks, dependent: :destroy
  has_many :tasks, through: :milestone_tasks

  validates :name, presence: true, length: { maximum: 255 }
  validates :account_id, presence: true
  validates :status, inclusion: { in: %w[planning in_progress completed cancelled] }, allow_nil: false

  before_save :set_completed_at

  scope :by_status, ->(status) { where(status: status) }
  scope :active, -> { where(status: %w[planning in_progress]) }
  scope :completed, -> { where(status: 'completed') }

  scope :search_by_name, ->(query) { where('name ILIKE ?', "%#{query}%") if query.present? }
  scope :overdue, -> { where('due_date < ?', Date.current) }
  scope :due_today, -> { where(due_date: Date.current) }
  scope :due_this_week, -> { where(due_date: Date.current..Date.current.end_of_week) }
  scope :due_this_month, -> { where(due_date: Date.current.beginning_of_month..Date.current.end_of_month) }

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

  def task_statistics
    # includes(:tasks)でロード済みの場合はメモリ上で計算、そうでない場合はDBクエリで取得
    if association(:tasks).loaded?
      total = tasks.size
      completed = tasks.count { |task| task.status == 'completed' }
    else
      # タスク総数と完了タスク数を取得
      total = tasks.count
      completed = tasks.where(status: 'completed').count
    end

    progress = total.zero? ? 0 : (completed.to_f / total * 100).round

    {
      total_tasks_count: total,
      completed_tasks_count: completed,
      progress_percentage: progress
    }
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

  private

  def set_completed_at
    if status == 'completed' && completed_at.nil?
      self.completed_at = Time.current
    elsif status != 'completed' && completed_at.present?
      self.completed_at = nil
    end
  end
end
