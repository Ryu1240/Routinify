# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# テストユーザーID
test_user_id = 'google-oauth2|114430600905307477148'

# カテゴリのサンプルデータを作成
puts 'Creating sample categories...'

sample_categories = [
  { name: '健康', account_id: test_user_id },
  { name: '仕事', account_id: test_user_id },
  { name: '個人', account_id: test_user_id },
  { name: '学習', account_id: test_user_id },
  { name: '家事', account_id: test_user_id },
]

categories_map = {}
sample_categories.each do |cat_attrs|
  category = Category.find_or_create_by(
    account_id: cat_attrs[:account_id],
    name: cat_attrs[:name]
  )
  categories_map[cat_attrs[:name]] = category
  puts "Category created/updated: #{category.name}"
end

puts 'Sample categories creation completed!'

# タスクのサンプルデータを作成
puts 'Creating sample tasks...'

# サンプルタスクデータ
sample_tasks = [
  {
    accountId: test_user_id,
    title: '朝の運動',
    due_date: 1.day.from_now,
    status: 'pending',
    priority: 'high',
    category_name: '健康',
  },
  {
    accountId: test_user_id,
    title: 'プロジェクト計画書の作成',
    due_date: Date.current + 3.days,
    status: 'in_progress',
    priority: 'high',
    category_name: '仕事',
  },
  {
    accountId: test_user_id,
    title: '買い物リストの作成',
    due_date: Date.current + 1.day,
    status: 'pending',
    priority: 'medium',
    category_name: '個人',
  },
  {
    accountId: test_user_id,
    title: '読書（技術書）',
    due_date: Date.current + 1.week,
    status: 'pending',
    priority: 'low',
    category_name: '学習',
  },
  {
    accountId: test_user_id,
    title: '部屋の掃除',
    due_date: 1.day.ago,
    status: 'completed',
    priority: 'medium',
    category_name: '家事',
  },
]

# タスクを作成（重複を避けるためfind_or_create_byを使用）
sample_tasks.each do |task_attrs|
  category = task_attrs[:category_name] ? categories_map[task_attrs[:category_name]] : nil
  
  task = Task.find_or_create_by(
    account_id: task_attrs[:accountId],
    title: task_attrs[:title]
  ) do |t|
    t.due_date = task_attrs[:due_date]
    t.status = task_attrs[:status]
    t.priority = task_attrs[:priority]
    t.category_id = category&.id
  end

  if task.persisted?
    puts "Task created/updated: #{task.title}"
  else
    puts "Failed to create task: #{task.title} - #{task.errors.full_messages.join(', ')}"
  end
end

puts 'Sample tasks creation completed!'

# 習慣化タスクのサンプルデータを作成
puts 'Creating sample routine tasks...'

current_time = Time.current

# 1. すぐに生成できるもの（即座にテスト可能）
# 毎日タスク - 期限オフセットあり（4日後）、カテゴリあり、高優先度
routine_task_1 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '朝の運動習慣'
) do |rt|
  rt.frequency = 'daily'
  rt.interval_value = nil
  rt.start_generation_at = 3.days.ago
  rt.next_generation_at = 1.day.ago
  rt.last_generated_at = nil
  rt.max_active_tasks = 3
  rt.category_id = categories_map['健康']&.id
  rt.priority = 'high'
  rt.is_active = true
  rt.due_date_offset_days = 4
  rt.due_date_offset_hour = nil
end
puts "RoutineTask created/updated: #{routine_task_1.title} (ID: #{routine_task_1.id})"

# 2. 毎週タスク - 期限オフセットあり（2日後、10時）、カテゴリあり、中優先度
routine_task_2 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '週次レビュー'
) do |rt|
  rt.frequency = 'weekly'
  rt.interval_value = nil
  rt.start_generation_at = 1.week.ago
  rt.next_generation_at = 2.days.ago
  rt.last_generated_at = nil
  rt.max_active_tasks = 2
  rt.category_id = categories_map['仕事']&.id
  rt.priority = 'medium'
  rt.is_active = true
  rt.due_date_offset_days = 2
  rt.due_date_offset_hour = 10
end
puts "RoutineTask created/updated: #{routine_task_2.title} (ID: #{routine_task_2.id})"

# 3. 毎月タスク - 期限オフセットあり（6日後）、カテゴリなし、低優先度
routine_task_3 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '月次振り返り'
) do |rt|
  rt.frequency = 'monthly'
  rt.interval_value = nil
  rt.start_generation_at = 1.month.ago
  rt.next_generation_at = 5.days.ago
  rt.last_generated_at = nil
  rt.max_active_tasks = 1
  rt.category_id = nil
  rt.priority = 'low'
  rt.is_active = true
  rt.due_date_offset_days = 6
  rt.due_date_offset_hour = nil
end
puts "RoutineTask created/updated: #{routine_task_3.title} (ID: #{routine_task_3.id})"

# 4. カスタム間隔タスク（3日ごと）- 期限オフセットあり（1日後、9時）、カテゴリあり
routine_task_4 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '3日ごとの読書習慣'
) do |rt|
  rt.frequency = 'custom'
  rt.interval_value = 3
  rt.start_generation_at = 5.days.ago
  rt.next_generation_at = 1.day.ago
  rt.last_generated_at = nil
  rt.max_active_tasks = 5
  rt.category_id = categories_map['学習']&.id
  rt.priority = 'medium'
  rt.is_active = true
  rt.due_date_offset_days = 1
  rt.due_date_offset_hour = 9
end
puts "RoutineTask created/updated: #{routine_task_4.title} (ID: #{routine_task_4.id})"

# 5. 既に生成済みのタスク（last_generated_atが設定されている）- 毎日タスク
routine_task_5 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '夜のストレッチ'
) do |rt|
  rt.frequency = 'daily'
  rt.interval_value = nil
  rt.start_generation_at = 1.week.ago
  rt.next_generation_at = current_time - 2.hours
  rt.last_generated_at = 1.day.ago
  rt.max_active_tasks = 3
  rt.category_id = categories_map['健康']&.id
  rt.priority = 'medium'
  rt.is_active = true
  rt.due_date_offset_days = 8
  rt.due_date_offset_hour = 22
end
puts "RoutineTask created/updated: #{routine_task_5.title} (ID: #{routine_task_5.id})"

# 6. 開始期限がまだ来ていないタスク（生成できない）- 毎週タスク
routine_task_6 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '来週から始める習慣'
) do |rt|
  rt.frequency = 'weekly'
  rt.interval_value = nil
  rt.start_generation_at = 3.days.from_now
  rt.next_generation_at = 3.days.from_now
  rt.last_generated_at = nil
  rt.max_active_tasks = 2
  rt.category_id = categories_map['個人']&.id
  rt.priority = 'low'
  rt.is_active = true
  rt.due_date_offset_days = nil
  rt.due_date_offset_hour = nil
end
puts "RoutineTask created/updated: #{routine_task_6.title} (ID: #{routine_task_6.id})"

# 7. 無効な習慣化タスク（is_active = false）
routine_task_7 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '一時停止中の習慣'
) do |rt|
  rt.frequency = 'daily'
  rt.interval_value = nil
  rt.start_generation_at = 1.week.ago
  rt.next_generation_at = 1.day.ago
  rt.last_generated_at = nil
  rt.max_active_tasks = 3
  rt.category_id = nil
  rt.priority = 'low'
  rt.is_active = false
  rt.due_date_offset_days = 8
  rt.due_date_offset_hour = nil
end
puts "RoutineTask created/updated: #{routine_task_7.title} (ID: #{routine_task_7.id})"

# 8. カスタム間隔タスク（7日ごと、実質weeklyと同じ）- 期限オフセットあり
routine_task_8 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '週次掃除（カスタム7日）'
) do |rt|
  rt.frequency = 'custom'
  rt.interval_value = 7
  rt.start_generation_at = 2.weeks.ago
  rt.next_generation_at = 1.day.ago
  rt.last_generated_at = nil
  rt.max_active_tasks = 2
  rt.category_id = categories_map['家事']&.id
  rt.priority = 'medium'
  rt.is_active = true
  rt.due_date_offset_days = 0
  rt.due_date_offset_hour = 18
end
puts "RoutineTask created/updated: #{routine_task_8.title} (ID: #{routine_task_8.id})"

puts 'Sample routine tasks creation completed!'
