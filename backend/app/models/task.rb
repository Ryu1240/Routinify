class Task < ApplicationRecord
  include AccountScoped

  belongs_to :category, optional: true
  belongs_to :routine_task, optional: true
  has_many :milestone_tasks, dependent: :delete_all
  has_many :milestones, through: :milestone_tasks

  validates :title, presence: true, length: { maximum: 255 }
  validates :account_id, presence: true
  validates :status, inclusion: { in: %w[pending in_progress completed on_hold] }, allow_nil: true
  validates :priority, inclusion: { in: %w[low medium high] }, allow_nil: true
  validates :due_date, future_date: { allow_past: true }, allow_nil: true

  # デフォルトスコープ: 削除されていないタスクのみ
  default_scope { where(deleted_at: nil) }

  scope :by_account, ->(account_id) { where(account_id: account_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :overdue, -> { where('due_date < ?', Time.current) }
  scope :due_today, -> { where(due_date: Date.current.beginning_of_day..Date.current.end_of_day) }
  scope :with_deleted, -> { unscope(where: :deleted_at) }
  scope :only_deleted, -> { unscope(where: :deleted_at).where.not(deleted_at: nil) }

  def self.for_user(user_id)
    by_account(user_id)
  end

  def self.search(query)
    where('title ILIKE ?', "%#{query}%")
  end

  def overdue?
    due_date.present? && due_date < Time.current
  end

  def completed?
    status == 'completed'
  end

  def in_progress?
    status == 'in_progress'
  end

  def pending?
    status == 'pending'
  end

  # 論理削除/物理削除の分岐
  def delete_task
    if routine_task_related?
      soft_delete
    else
      hard_delete
    end
  end

  # 論理削除（deleted_atを設定）
  def soft_delete
    update_column(:deleted_at, Time.current)
  end

  # 物理削除
  def hard_delete
    destroy
  end

  # 論理削除済みか判定
  def deleted?
    deleted_at.present?
  end

  # 習慣化タスクに紐づくか判定
  def routine_task_related?
    routine_task_id.present?
  end

  private

  def set_default_status
    self.status ||= 'pending'
  end
end
