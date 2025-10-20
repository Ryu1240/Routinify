class Task < ApplicationRecord
  include AccountScoped

  belongs_to :category, optional: true
  belongs_to :recurring_task, optional: true

  validates :title, presence: true, length: { maximum: 255 }
  validates :account_id, presence: true
  validates :status, inclusion: { in: %w[pending in_progress completed on_hold] }, allow_nil: true
  validates :priority, inclusion: { in: %w[low medium high] }, allow_nil: true
  validates :due_date, future_date: { allow_past_in_test: true }, allow_nil: true

  scope :by_account, ->(account_id) { where(account_id: account_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :overdue, -> { where('due_date < ?', Time.current) }
  scope :due_today, -> { where(due_date: Date.current.beginning_of_day..Date.current.end_of_day) }

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

  private

  def set_default_status
    self.status ||= 'pending'
  end
end
