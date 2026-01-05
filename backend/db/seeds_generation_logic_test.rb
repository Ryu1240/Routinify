# 習慣化タスク生成ロジック検証用のテストデータ
# 今回の実装（next_generation_at基準の計算、重複生成防止、タスク生成時のみ更新）を検証するためのデータ
#
# 使用方法:
#   rails runner db/seeds_generation_logic_test.rb
#   または
#   rails db:seed:generation_logic_test
#
# 検証ケース:
#   1. 完了済みタスクが4個、未完了タスクが0個、上限3のケース
#      → next_generation_atが今日の00:00:00に設定されている場合、今日のタスクが正しく生成されること
#   2. next_generation_atが今日の早い時刻に設定されているケース
#      → next_generation_atが過去の場合、その日付を基準に計算されること
#   3. 既存のタスク（完了済み含む）がある場合の重複生成を防ぐケース
#      → 既存のタスク（完了済み含む）のgenerated_atをチェックして重複生成を防ぐこと
#   4. タスクが生成されない場合の更新チェック
#      → タスクが生成されない場合、last_generated_atとnext_generation_atが更新されないこと

# テストユーザーID
test_user_id = 'google-oauth2|114430600905307477148'

puts '========================================'
puts '習慣化タスク生成ロジック検証用データを作成しています...'
puts '========================================'
puts ''

# カテゴリの取得または作成
category = Category.find_or_create_by(
  account_id: test_user_id,
  name: '健康'
)
puts "カテゴリ確認/作成: #{category.name} (ID: #{category.id})"
puts ''

today = Date.current
today_beginning = today.beginning_of_day.in_time_zone('Tokyo')

# ケース1: 完了済みタスクが4個、未完了タスクが0個、上限3のケース
# 今回のバグ修正の検証: next_generation_atが今日の早い時刻に設定されていても、今日のタスクが正しく生成される
puts 'ケース1: 完了済みタスクが4個、未完了タスクが0個、上限3のケース'
routine_task_1 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '[検証] 完了済みタスクが多い場合の生成テスト'
) do |rt|
  rt.frequency = 'daily'
  rt.interval_value = nil
  rt.start_generation_at = 5.days.ago
  rt.next_generation_at = today_beginning # 今日の00:00:00 JST
  rt.last_generated_at = 1.day.ago
  rt.max_active_tasks = 3
  rt.category_id = category.id
  rt.priority = 'high'
  rt.is_active = true
  rt.due_date_offset_days = 1
  rt.due_date_offset_hour = nil
end

# 完了済みタスクを4個作成（昨日、一昨日、3日前、4日前）
4.times do |i|
  task_date = (today - (i + 1).days).beginning_of_day.in_time_zone('Tokyo')
  Task.find_or_create_by(
    account_id: test_user_id,
    routine_task_id: routine_task_1.id,
    generated_at: task_date
  ) do |t|
    t.title = routine_task_1.title
    t.due_date = task_date.to_date + 1.day
    t.status = 'completed'
    t.priority = routine_task_1.priority
    t.category_id = routine_task_1.category_id
  end
end

puts "  RoutineTask作成: #{routine_task_1.title} (ID: #{routine_task_1.id})"
puts "  完了済みタスク: 4個"
puts "  未完了タスク: 0個"
puts "  上限: 3"
puts "  検証ポイント: next_generation_atが今日の00:00:00に設定されている場合、今日のタスクが正しく生成されること"
puts ''

# ケース2: next_generation_atが今日の早い時刻に設定されているケース
puts 'ケース2: next_generation_atが今日の早い時刻に設定されているケース'
routine_task_2 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '[検証] next_generation_atが今日の早い時刻の場合'
) do |rt|
  rt.frequency = 'daily'
  rt.interval_value = nil
  rt.start_generation_at = 3.days.ago
  rt.next_generation_at = today_beginning + 6.hours # 今日の06:00:00 JST
  rt.last_generated_at = 1.day.ago
  rt.max_active_tasks = 5
  rt.category_id = category.id
  rt.priority = 'medium'
  rt.is_active = true
  rt.due_date_offset_days = 2
  rt.due_date_offset_hour = nil
end

puts "  RoutineTask作成: #{routine_task_2.title} (ID: #{routine_task_2.id})"
puts "  next_generation_at: #{routine_task_2.next_generation_at.in_time_zone('Tokyo')}"
puts "  検証ポイント: next_generation_atが過去の場合、その日付を基準に計算されること"
puts ''

# ケース3: 既存のタスク（完了済み含む）がある場合の重複生成を防ぐケース
puts 'ケース3: 既存のタスク（完了済み含む）がある場合の重複生成を防ぐケース'
routine_task_3 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '[検証] 重複生成防止のテスト'
) do |rt|
  rt.frequency = 'daily'
  rt.interval_value = nil
  rt.start_generation_at = 3.days.ago
  rt.next_generation_at = 1.day.ago
  rt.last_generated_at = 2.days.ago
  rt.max_active_tasks = 5
  rt.category_id = category.id
  rt.priority = 'low'
  rt.is_active = true
  rt.due_date_offset_days = 1
  rt.due_date_offset_hour = nil
end

# 今日のタスクを完了済みで作成
Task.find_or_create_by(
  account_id: test_user_id,
  routine_task_id: routine_task_3.id,
  generated_at: today_beginning
) do |t|
  t.title = routine_task_3.title
  t.due_date = today + 1.day
  t.status = 'completed'
  t.priority = routine_task_3.priority
  t.category_id = routine_task_3.category_id
end

# 昨日のタスクを未完了で作成
Task.find_or_create_by(
  account_id: test_user_id,
  routine_task_id: routine_task_3.id,
  generated_at: (today - 1.day).beginning_of_day.in_time_zone('Tokyo')
) do |t|
  t.title = routine_task_3.title
  t.due_date = today
  t.status = 'pending'
  t.priority = routine_task_3.priority
  t.category_id = routine_task_3.category_id
end

puts "  RoutineTask作成: #{routine_task_3.title} (ID: #{routine_task_3.id})"
puts "  今日のタスク（完了済み）: 1個"
puts "  昨日のタスク（未完了）: 1個"
puts "  検証ポイント: 既存のタスク（完了済み含む）のgenerated_atをチェックして重複生成を防ぐこと"
puts ''

# ケース4: タスクが生成されない場合の更新チェック
puts 'ケース4: タスクが生成されない場合の更新チェック'
routine_task_4 = RoutineTask.find_or_create_by(
  account_id: test_user_id,
  title: '[検証] タスク生成なしの場合の更新チェック'
) do |rt|
  rt.frequency = 'daily'
  rt.interval_value = nil
  rt.start_generation_at = 1.day.from_now # 未来
  rt.next_generation_at = 1.day.from_now
  rt.last_generated_at = 1.day.ago
  rt.max_active_tasks = 3
  rt.category_id = category.id
  rt.priority = 'medium'
  rt.is_active = true
  rt.due_date_offset_days = 1
  rt.due_date_offset_hour = nil
end

original_last_generated_at = routine_task_4.last_generated_at
original_next_generation_at = routine_task_4.next_generation_at

puts "  RoutineTask作成: #{routine_task_4.title} (ID: #{routine_task_4.id})"
puts "  start_generation_at: #{routine_task_4.start_generation_at.in_time_zone('Tokyo')} (未来)"
puts "  検証ポイント: タスクが生成されない場合、last_generated_atとnext_generation_atが更新されないこと"
puts "  現在のlast_generated_at: #{original_last_generated_at.in_time_zone('Tokyo')}"
puts "  現在のnext_generation_at: #{original_next_generation_at.in_time_zone('Tokyo')}"
puts ''

puts '========================================'
puts 'テストデータの作成が完了しました！'
puts '========================================'
puts ''
puts '検証方法:'
puts '1. ケース1: RoutineTaskGeneratorJob.perform_now(routine_task_1.id, SecureRandom.uuid) を実行'
puts '   → 今日のタスクが1個生成されることを確認'
puts ''
puts '2. ケース2: RoutineTaskGeneratorJob.perform_now(routine_task_2.id, SecureRandom.uuid) を実行'
puts '   → next_generation_atの日付（今日）を基準に計算されることを確認'
puts ''
puts '3. ケース3: RoutineTaskGeneratorJob.perform_now(routine_task_3.id, SecureRandom.uuid) を実行'
puts '   → 今日のタスクは既に存在するため、重複生成されないことを確認'
puts ''
puts '4. ケース4: RoutineTaskGeneratorJob.perform_now(routine_task_4.id, SecureRandom.uuid) を実行'
puts '   → タスクが生成されず、last_generated_atとnext_generation_atが更新されないことを確認'
puts ''

