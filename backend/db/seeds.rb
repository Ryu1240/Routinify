# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# 既存データを削除するかどうか（環境変数で制御、デフォルトはfalse）
# 使用方法: RESET_SEED=true rails db:seed
# または: RESET_SEED=true bundle exec rails db:seed
reset_seed = ENV['RESET_SEED'] == 'true' || ENV['RESET_SEED'] == '1'

# テストユーザーID
test_user_id = 'google-oauth2|114430600905307477148'

# 既存データを削除（開発環境とテスト環境のみ）
if reset_seed && (Rails.env.development? || Rails.env.test?)
  puts '========================================'
  puts '既存のシードデータを削除しています...'
  puts '========================================'
  
  # 関連データを削除（外部キー制約があるため順序が重要）
  MilestoneTask.where(milestone_id: Milestone.where(account_id: test_user_id).pluck(:id)).destroy_all
  puts "  - MilestoneTasks deleted"
  
  Task.where(account_id: test_user_id).destroy_all
  puts "  - Tasks deleted"
  
  RoutineTask.where(account_id: test_user_id).destroy_all
  puts "  - RoutineTasks deleted"
  
  Category.where(account_id: test_user_id).destroy_all
  puts "  - Categories deleted"
  
  Milestone.where(account_id: test_user_id).destroy_all
  puts "  - Milestones deleted"
  
  puts '既存データの削除が完了しました！'
  puts '========================================'
  puts ''
elsif reset_seed && Rails.env.production?
  puts '警告: 本番環境では既存データの削除は実行されません。'
  puts '開発環境またはテスト環境で実行してください。'
  puts ''
end

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

# ===== 動作確認用：一度に3つくらいのタスクが生成される習慣化タスク =====

# 9. 動作確認用：毎日タスク - 3日前から開始、last_generated_atを3日前に設定、max_active_tasks=3
# → 3日経過しているので3つのタスクが生成される
routine_task_9 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '【動作確認用】毎日の運動習慣'
) do |rt|
  rt.frequency = 'daily'
  rt.interval_value = nil
  rt.start_generation_at = 5.days.ago
  rt.next_generation_at = 2.days.ago
  rt.last_generated_at = 3.days.ago  # 3日前に最後に生成 → 3日経過 → 3つ生成される
  rt.max_active_tasks = 3
  rt.category_id = categories_map['健康']&.id
  rt.priority = 'high'
  rt.is_active = true
  rt.due_date_offset_days = 1
  rt.due_date_offset_hour = nil
end
puts "RoutineTask created/updated: #{routine_task_9.title} (ID: #{routine_task_9.id})"

# 10. 動作確認用：毎週タスク - 3週間前から開始、last_generated_atを3週間前に設定、max_active_tasks=3
# → 3週間経過（21日）、interval_days=7なので 21/7 = 3つのタスクが生成される
routine_task_10 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '【動作確認用】週次レビュー'
) do |rt|
  rt.frequency = 'weekly'
  rt.interval_value = nil
  rt.start_generation_at = 4.weeks.ago
  rt.next_generation_at = 2.weeks.ago
  rt.last_generated_at = 3.weeks.ago  # 3週間前に最後に生成 → 3週間経過 → 3つ生成される
  rt.max_active_tasks = 3
  rt.category_id = categories_map['仕事']&.id
  rt.priority = 'medium'
  rt.is_active = true
  rt.due_date_offset_days = 2
  rt.due_date_offset_hour = 10
end
puts "RoutineTask created/updated: #{routine_task_10.title} (ID: #{routine_task_10.id})"

# 11. 動作確認用：カスタム間隔タスク（2日ごと）- 6日前から開始、last_generated_atを6日前に設定、max_active_tasks=3
# → 6日経過、interval_days=2なので 6/2 = 3つのタスクが生成される
routine_task_11 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '【動作確認用】2日ごとの読書習慣'
) do |rt|
  rt.frequency = 'custom'
  rt.interval_value = 2
  rt.start_generation_at = 7.days.ago
  rt.next_generation_at = 5.days.ago
  rt.last_generated_at = 6.days.ago  # 6日前に最後に生成 → 6日経過、interval=2 → 3つ生成される
  rt.max_active_tasks = 3
  rt.category_id = categories_map['学習']&.id
  rt.priority = 'medium'
  rt.is_active = true
  rt.due_date_offset_days = 1
  rt.due_date_offset_hour = 9
end
puts "RoutineTask created/updated: #{routine_task_11.title} (ID: #{routine_task_11.id})"

# 12. 動作確認用：毎日タスク - まだ生成されていない（last_generated_at=nil）、max_active_tasks=3
# → 最初の生成なので1つだけ生成される（動作確認用として追加）
routine_task_12 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '【動作確認用】朝のストレッチ'
) do |rt|
  rt.frequency = 'daily'
  rt.interval_value = nil
  rt.start_generation_at = 5.days.ago
  rt.next_generation_at = 4.days.ago
  rt.last_generated_at = nil  # まだ生成されていない → 1つだけ生成される
  rt.max_active_tasks = 3
  rt.category_id = categories_map['健康']&.id
  rt.priority = 'medium'
  rt.is_active = true
  rt.due_date_offset_days = 0
  rt.due_date_offset_hour = 7
end
puts "RoutineTask created/updated: #{routine_task_12.title} (ID: #{routine_task_12.id})"

puts 'Sample routine tasks creation completed!'
puts '===== 動作確認用の習慣化タスク ====='
puts '以下の習慣化タスクが一度に3つくらいのタスクを生成します:'
puts "  - #{routine_task_9.title} (ID: #{routine_task_9.id})"
puts "  - #{routine_task_10.title} (ID: #{routine_task_10.id})"
puts "  - #{routine_task_11.title} (ID: #{routine_task_11.id})"
puts "  - #{routine_task_12.title} (ID: #{routine_task_12.id}) - 最初の生成なので1つだけ"
puts '====================================='

# マイルストーンのサンプルデータを作成
puts ''
puts 'Creating sample milestones...'

# まず、マイルストーン用のタスクを作成
milestone_tasks_data = [
  {
    accountId: test_user_id,
    title: '要件定義書の作成',
    due_date: Date.current + 5.days,
    status: 'completed',
    priority: 'high',
    category_name: '仕事',
  },
  {
    accountId: test_user_id,
    title: '設計書の作成',
    due_date: Date.current + 10.days,
    status: 'completed',
    priority: 'high',
    category_name: '仕事',
  },
  {
    accountId: test_user_id,
    title: 'コーディング',
    due_date: Date.current + 15.days,
    status: 'in_progress',
    priority: 'high',
    category_name: '仕事',
  },
  {
    accountId: test_user_id,
    title: 'テスト実装',
    due_date: Date.current + 20.days,
    status: 'pending',
    priority: 'medium',
    category_name: '仕事',
  },
  {
    accountId: test_user_id,
    title: 'デプロイ',
    due_date: Date.current + 25.days,
    status: 'pending',
    priority: 'high',
    category_name: '仕事',
  },
  {
    accountId: test_user_id,
    title: '朝の運動',
    due_date: Date.current,
    status: 'completed',
    priority: 'high',
    category_name: '健康',
  },
  {
    accountId: test_user_id,
    title: '夜のストレッチ',
    due_date: Date.current + 1.day,
    status: 'pending',
    priority: 'medium',
    category_name: '健康',
  },
  {
    accountId: test_user_id,
    title: '読書（技術書）',
    due_date: Date.current + 2.days,
    status: 'completed',
    priority: 'low',
    category_name: '学習',
  },
  {
    accountId: test_user_id,
    title: 'オンライン講座受講',
    due_date: Date.current + 7.days,
    status: 'in_progress',
    priority: 'medium',
    category_name: '学習',
  },
  {
    accountId: test_user_id,
    title: '技術ブログ執筆',
    due_date: Date.current + 14.days,
    status: 'pending',
    priority: 'low',
    category_name: '学習',
  },
]

milestone_tasks_map = {}
milestone_tasks_data.each do |task_attrs|
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
  
  milestone_tasks_map[task_attrs[:title]] = task
end

# マイルストーンのサンプルデータ
sample_milestones = [
  {
    name: 'プロジェクト開発',
    description: '新機能の開発を完了させる',
    status: 'in_progress',
    start_date: Date.current - 7.days,
    due_date: Date.current + 30.days,
    task_titles: ['要件定義書の作成', '設計書の作成', 'コーディング', 'テスト実装', 'デプロイ'],
  },
  {
    name: '健康習慣の確立',
    description: '運動とストレッチを習慣化する',
    status: 'in_progress',
    start_date: Date.current - 3.days,
    due_date: Date.current + 7.days,
    task_titles: ['朝の運動', '夜のストレッチ'],
  },
  {
    name: 'スキルアップ計画',
    description: '技術力を向上させるための学習計画',
    status: 'planning',
    start_date: Date.current + 1.day,
    due_date: Date.current + 30.days,
    task_titles: ['読書（技術書）', 'オンライン講座受講', '技術ブログ執筆'],
  },
  {
    name: '完了したプロジェクト',
    description: '過去に完了したプロジェクトの例',
    status: 'completed',
    start_date: Date.current - 60.days,
    due_date: Date.current - 30.days,
    completed_at: Date.current - 30.days,
    task_titles: [],
  },
  {
    name: '期限切れのマイルストーン',
    description: '期限が過ぎたマイルストーン',
    status: 'in_progress',
    start_date: Date.current - 30.days,
    due_date: Date.current - 5.days,
    task_titles: [],
  },
  {
    name: '今日が期限のマイルストーン',
    description: '今日が期限日のマイルストーン',
    status: 'in_progress',
    start_date: Date.current - 7.days,
    due_date: Date.current,
    task_titles: [],
  },
  {
    name: '今週が期限のマイルストーン',
    description: '今週内に期限が来るマイルストーン',
    status: 'planning',
    start_date: Date.current - 3.days,
    due_date: Date.current + 3.days,
    task_titles: [],
  },
  {
    name: '今月が期限のマイルストーン',
    description: '今月中に期限が来るマイルストーン',
    status: 'planning',
    start_date: Date.current - 10.days,
    due_date: Date.current + 20.days,
    task_titles: [],
  },
  {
    name: 'キャンセルされたマイルストーン',
    description: 'キャンセルされたマイルストーンの例',
    status: 'cancelled',
    start_date: Date.current - 20.days,
    due_date: Date.current + 10.days,
    task_titles: [],
  },
]

milestones_map = {}
sample_milestones.each do |milestone_attrs|
  milestone = Milestone.find_or_create_by(
    account_id: test_user_id,
    name: milestone_attrs[:name]
  ) do |m|
    m.description = milestone_attrs[:description]
    m.status = milestone_attrs[:status]
    m.start_date = milestone_attrs[:start_date]
    m.due_date = milestone_attrs[:due_date]
    m.completed_at = milestone_attrs[:completed_at]
  end
  
  milestones_map[milestone_attrs[:name]] = milestone
  puts "Milestone created/updated: #{milestone.name} (Status: #{milestone.status})"
  
  # マイルストーンに関連するタスクを追加
  if milestone_attrs[:task_titles].present?
    milestone_attrs[:task_titles].each do |task_title|
      task = milestone_tasks_map[task_title]
      if task
        MilestoneTask.find_or_create_by(
          milestone_id: milestone.id,
          task_id: task.id
        )
        puts "  - Task linked: #{task.title}"
      end
    end
  end
end

puts 'Sample milestones creation completed!'
puts '===== 動作確認用のマイルストーン ====='
puts '以下のマイルストーンが作成されました:'
puts '  - プロジェクト開発 (進行中、タスク5件)'
puts '  - 健康習慣の確立 (進行中、タスク2件)'
puts '  - スキルアップ計画 (計画中、タスク3件)'
puts '  - 完了したプロジェクト (完了)'
puts '  - 期限切れのマイルストーン (期限切れ)'
puts '  - 今日が期限のマイルストーン (期限: 今日)'
puts '  - 今週が期限のマイルストーン (期限: 今週)'
puts '  - 今月が期限のマイルストーン (期限: 今月)'
puts '  - キャンセルされたマイルストーン (キャンセル)'
puts '====================================='
