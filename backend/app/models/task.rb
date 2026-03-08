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

  scope :active, -> { where(deleted_at: nil) }
  scope :by_account, ->(account_id) { where(account_id: account_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :by_statuses, ->(statuses) { where(status: statuses) if statuses.present? }
  scope :overdue, -> { where('due_date < ?', Time.current) }
  scope :due_today, -> { where(due_date: Date.current.beginning_of_day..Date.current.end_of_day) }
  scope :with_deleted, -> { all }
  scope :only_deleted, -> { where.not(deleted_at: nil) }
  scope :order_by_due_date, ->(order = :asc) {
    order(Arel.sql('CASE WHEN due_date IS NULL THEN 1 ELSE 0 END'), due_date: order)
  }

  def self.for_user(user_id)
    active.by_account(user_id)
  end

  def self.search(query)
    active.where('title ILIKE ?', "%#{query}%")
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

  after_commit :schedule_achievement_statistics_update,
               on: [ :create, :update ],
               if: -> {
                 routine_task_id.present? && (
                   saved_change_to_status? ||
                   saved_change_to_generated_at? ||
                   saved_change_to_deleted_at?
                 )
               }

  # 論理削除（deleted_atを設定）
  # update を使用して after_commit を発火させ、達成状況統計の更新をトリガーする
  def soft_delete
    update(deleted_at: Time.current)
  end

  private

  def schedule_achievement_statistics_update
    base_date = (generated_at || created_at).in_time_zone('Tokyo').to_date

    # 週次・月次の両方の統計を更新
    UpdateAchievementStatisticsJob.perform_later(routine_task_id, 'weekly', base_date.beginning_of_week)
    UpdateAchievementStatisticsJob.perform_later(routine_task_id, 'monthly', base_date.beginning_of_month)
  end

  def set_default_status
    self.status ||= 'pending'
  end
end
