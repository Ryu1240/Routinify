# バッチタスク生成機能のテスト用seedファイル
# 大量のアクティブな習慣化タスクを作成します
#
# 使用方法:
#   rails runner db/seeds_batch_generation.rb
#   または
#   rails db:seed:batch_generation

# テストユーザーID
test_user_id = 'google-oauth2|114430600905307477148'

puts '========================================'
puts 'バッチタスク生成テスト用データを作成しています...'
puts '========================================'
puts ''

# カテゴリの取得または作成
categories_map = {}
category_names = ['健康', '仕事', '個人', '学習', '家事']

category_names.each do |name|
  category = Category.find_or_create_by(
    account_id: test_user_id,
    name: name
  )
  categories_map[name] = category
  puts "カテゴリ確認/作成: #{category.name} (ID: #{category.id})"
end

puts ''
puts '大量の習慣化タスクを作成しています...'

# 習慣化タスクのタイトルと設定のテンプレート
routine_task_templates = [
  # 毎日タスク
  { base_title: '朝の運動習慣', frequency: 'daily', category: '健康', priority: 'high' },
  { base_title: '朝の瞑想', frequency: 'daily', category: '健康', priority: 'medium' },
  { base_title: '朝の読書', frequency: 'daily', category: '学習', priority: 'medium' },
  { base_title: '朝の水分補給', frequency: 'daily', category: '健康', priority: 'low' },
  { base_title: '朝のストレッチ', frequency: 'daily', category: '健康', priority: 'medium' },
  { base_title: '朝の計画立て', frequency: 'daily', category: '仕事', priority: 'high' },
  { base_title: '朝のメール確認', frequency: 'daily', category: '仕事', priority: 'high' },
  { base_title: '朝の日記', frequency: 'daily', category: '個人', priority: 'low' },
  { base_title: '朝の散歩', frequency: 'daily', category: '健康', priority: 'medium' },
  { base_title: '朝の勉強', frequency: 'daily', category: '学習', priority: 'high' },
  
  # 毎週タスク
  { base_title: '週次レビュー', frequency: 'weekly', category: '仕事', priority: 'high' },
  { base_title: '週次掃除', frequency: 'weekly', category: '家事', priority: 'medium' },
  { base_title: '週次買い物', frequency: 'weekly', category: '個人', priority: 'medium' },
  { base_title: '週次読書', frequency: 'weekly', category: '学習', priority: 'low' },
  { base_title: '週次運動', frequency: 'weekly', category: '健康', priority: 'high' },
  { base_title: '週次振り返り', frequency: 'weekly', category: '個人', priority: 'medium' },
  { base_title: '週次報告書作成', frequency: 'weekly', category: '仕事', priority: 'high' },
  { base_title: '週次メンテナンス', frequency: 'weekly', category: '仕事', priority: 'medium' },
  { base_title: '週次学習計画', frequency: 'weekly', category: '学習', priority: 'medium' },
  { base_title: '週次健康チェック', frequency: 'weekly', category: '健康', priority: 'medium' },
  
  # 毎月タスク
  { base_title: '月次振り返り', frequency: 'monthly', category: '個人', priority: 'high' },
  { base_title: '月次報告', frequency: 'monthly', category: '仕事', priority: 'high' },
  { base_title: '月次目標設定', frequency: 'monthly', category: '個人', priority: 'medium' },
  { base_title: '月次健康診断', frequency: 'monthly', category: '健康', priority: 'medium' },
  { base_title: '月次学習計画', frequency: 'monthly', category: '学習', priority: 'medium' },
  { base_title: '月次掃除', frequency: 'monthly', category: '家事', priority: 'low' },
  { base_title: '月次予算確認', frequency: 'monthly', category: '個人', priority: 'high' },
  { base_title: '月次進捗確認', frequency: 'monthly', category: '仕事', priority: 'medium' },
  { base_title: '月次読書計画', frequency: 'monthly', category: '学習', priority: 'low' },
  { base_title: '月次運動計画', frequency: 'monthly', category: '健康', priority: 'medium' },
  
  # カスタム間隔タスク
  { base_title: '3日ごとの運動', frequency: 'custom', interval_value: 3, category: '健康', priority: 'medium' },
  { base_title: '2日ごとの読書', frequency: 'custom', interval_value: 2, category: '学習', priority: 'medium' },
  { base_title: '5日ごとの掃除', frequency: 'custom', interval_value: 5, category: '家事', priority: 'low' },
  { base_title: '4日ごとの勉強', frequency: 'custom', interval_value: 4, category: '学習', priority: 'high' },
  { base_title: '6日ごとのレビュー', frequency: 'custom', interval_value: 6, category: '仕事', priority: 'medium' },
  { base_title: '7日ごとのメンテナンス', frequency: 'custom', interval_value: 7, category: '仕事', priority: 'low' },
  { base_title: '10日ごとのチェック', frequency: 'custom', interval_value: 10, category: '個人', priority: 'low' },
  { base_title: '14日ごとの報告', frequency: 'custom', interval_value: 14, category: '仕事', priority: 'medium' },
]

# 作成する習慣化タスクの総数（各テンプレートから複数作成）
total_routine_tasks = 100

# 各テンプレートから作成する数
tasks_per_template = (total_routine_tasks.to_f / routine_task_templates.length).ceil

created_count = 0
routine_task_templates.each_with_index do |template, template_index|
  tasks_per_template.times do |task_index|
    break if created_count >= total_routine_tasks
    
    # ユニークなタイトルを生成（番号付き）
    title = if task_index == 0
      template[:base_title]
    else
      "#{template[:base_title]} (#{task_index + 1})"
    end
    
    # カテゴリを取得
    category = categories_map[template[:category]]
    
    # ランダムな設定でバリエーションを付ける
    days_ago = rand(1..10) # 1-10日前に開始
    max_active_tasks = [1, 2, 3, 5, 7].sample # ランダムな最大タスク数
    due_date_offset_days = rand(0..7) # 0-7日のオフセット
    
    # 過去の生成日をランダムに設定（一部は生成済み、一部は未生成）
    last_generated_at = if rand < 0.7 # 70%は生成済み
      rand(days_ago.days.ago..1.day.ago)
    else
      nil
    end
    
    # next_generation_atを設定（過去に設定して生成可能にする）
    next_generation_at = if last_generated_at
      # 生成済みの場合、間隔に基づいて次回生成日を計算
      interval_days = case template[:frequency]
      when 'daily'
        1
      when 'weekly'
        7
      when 'monthly'
        30
      when 'custom'
        template[:interval_value] || 1
      else
        1
      end
      
      # 次回生成日を過去に設定して、複数のタスクが生成されるようにする
      last_generated_at + (interval_days * rand(1..3))
    else
      # 未生成の場合、過去に設定
      rand(days_ago.days.ago..1.day.ago)
    end
    
    routine_task = RoutineTask.find_or_create_by(
      account_id: test_user_id,
      title: title
    ) do |rt|
      rt.frequency = template[:frequency]
      rt.interval_value = template[:interval_value]
      rt.start_generation_at = days_ago.days.ago
      rt.next_generation_at = next_generation_at
      rt.last_generated_at = last_generated_at
      rt.max_active_tasks = max_active_tasks
      rt.category_id = category&.id
      rt.priority = template[:priority]
      rt.is_active = true
      rt.due_date_offset_days = due_date_offset_days
      rt.due_date_offset_hour = rand(0..23) # ランダムな時刻
    end
    
    if routine_task.persisted?
      created_count += 1
      if created_count % 10 == 0
        puts "  #{created_count}個の習慣化タスクを作成しました..."
      end
    end
  end
end

puts ''
puts "合計 #{created_count}個の習慣化タスクを作成しました！"
puts ''
puts '========================================'
puts '作成された習慣化タスクの統計:'
puts "  総数: #{RoutineTask.where(account_id: test_user_id, is_active: true).count}個"
puts "  毎日: #{RoutineTask.where(account_id: test_user_id, is_active: true, frequency: 'daily').count}個"
puts "  毎週: #{RoutineTask.where(account_id: test_user_id, is_active: true, frequency: 'weekly').count}個"
puts "  毎月: #{RoutineTask.where(account_id: test_user_id, is_active: true, frequency: 'monthly').count}個"
puts "  カスタム: #{RoutineTask.where(account_id: test_user_id, is_active: true, frequency: 'custom').count}個"
puts '========================================'
puts ''
puts 'バッチタスク生成ボタンをクリックして、非同期処理をテストしてください！'
puts ''

