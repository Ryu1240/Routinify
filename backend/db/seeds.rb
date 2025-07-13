# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# タスクのサンプルデータを作成
puts "Creating sample tasks..."

# テストユーザーID
test_user_id = "google-oauth2|114430600905307477148"

# サンプルタスクデータ
sample_tasks = [
  {
    accountId: test_user_id,
    title: "朝の運動",
    due_date: Date.current,
    status: "未着手",
    priority: "high",
    category: "健康"
  },
  {
    accountId: test_user_id,
    title: "プロジェクト計画書の作成",
    due_date: Date.current + 3.days,
    status: "進行中",
    priority: "high",
    category: "仕事"
  },
  {
    accountId: test_user_id,
    title: "買い物リストの作成",
    due_date: Date.current + 1.day,
    status: "未着手",
    priority: "medium",
    category: "個人"
  },
  {
    accountId: test_user_id,
    title: "読書（技術書）",
    due_date: Date.current + 1.week,
    status: "未着手",
    priority: "low",
    category: "学習"
  },
  {
    accountId: test_user_id,
    title: "部屋の掃除",
    due_date: Date.current - 1.day,
    status: "完了",
    priority: "medium",
    category: "家事"
  }
]

# タスクを作成（重複を避けるためfind_or_create_byを使用）
sample_tasks.each do |task_attrs|
  task = Task.find_or_create_by(
    account_id: task_attrs[:accountId],
    title: task_attrs[:title]
  ) do |t|
    t.due_date = task_attrs[:due_date]
    t.status = task_attrs[:status]
    t.priority = task_attrs[:priority]
    t.category = task_attrs[:category]
  end

  if task.persisted?
    puts "Task created/updated: #{task.title}"
  else
    puts "Failed to create task: #{task.title} - #{task.errors.full_messages.join(', ')}"
  end
end

puts "Sample tasks creation completed!"
