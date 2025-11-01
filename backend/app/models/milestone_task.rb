class MilestoneTask < ApplicationRecord
  self.table_name = 'milestone_tasks'
  self.primary_key = nil

  belongs_to :milestone
  belongs_to :task

  validates :milestone_id, presence: true
  validates :task_id, presence: true
  validates :milestone_id, uniqueness: { scope: :task_id }
end

