class MilestoneTask < ApplicationRecord
  self.table_name = 'milestone_tasks'
  # 複合主キー(milestone_id, task_id)を使用するため、primary_keyをnilに設定
  self.primary_key = nil

  belongs_to :milestone
  belongs_to :task

  validates :milestone_id, presence: true
  validates :task_id, presence: true
  # データベースレベルの複合主キー制約により一意性が保証されるが、
  # Rails側でもバリデーションを設定することでエラーメッセージを分かりやすくする
  validates :milestone_id, uniqueness: { scope: :task_id }

  # 複合主キーで検索する際のヘルパーメソッド
  def self.find_by_ids(milestone_id:, task_id:)
    find_by(milestone_id: milestone_id, task_id: task_id)
  end
end
