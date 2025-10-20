FactoryBot.define do
  factory :routine_task do
    sequence(:account_id) { |n| "user-#{n}" }
    sequence(:title) { |n| "習慣タスク #{n}" }
    frequency { 'daily' }
    interval_value { 1 }
    last_generated_at { nil }
    next_generation_at { 1.day.from_now }
    max_active_tasks { 3 }
    category_id { nil }
    priority { 'medium' }
    is_active { true }

    # 異なる頻度の習慣タスク
    trait :daily do
      frequency { 'daily' }
      interval_value { 1 }
      next_generation_at { 1.day.from_now }
    end

    trait :weekly do
      frequency { 'weekly' }
      interval_value { 1 }
      next_generation_at { 1.week.from_now }
    end

    trait :monthly do
      frequency { 'monthly' }
      interval_value { 1 }
      next_generation_at { 1.month.from_now }
    end

    trait :custom do
      frequency { 'custom' }
      interval_value { 3 }
      next_generation_at { 3.days.from_now }
    end

    # 異なる優先度
    trait :high_priority do
      priority { 'high' }
    end

    trait :low_priority do
      priority { 'low' }
    end

    # カテゴリ関連
    trait :with_category do
      association :category
    end

    # 無効な習慣タスク
    trait :inactive do
      is_active { false }
    end

    # 生成済み
    trait :with_last_generation do
      last_generated_at { 1.day.ago }
    end

    # 生成準備完了
    trait :ready_to_generate do
      next_generation_at { 1.hour.ago }
    end

    # 上限変更
    trait :max_tasks_1 do
      max_active_tasks { 1 }
    end

    trait :max_tasks_5 do
      max_active_tasks { 5 }
    end

    # 生成済みタスク付き
    trait :with_generated_tasks do
      after(:create) do |routine_task|
        create_list(:task, 2,
                    account_id: routine_task.account_id,
                    routine_task: routine_task,
                    generated_at: 1.day.ago,
                    status: 'pending')
      end
    end

    # アクティブなタスクが上限に達している
    trait :at_max_capacity do
      after(:create) do |routine_task|
        create_list(:task, routine_task.max_active_tasks,
                    account_id: routine_task.account_id,
                    routine_task: routine_task,
                    generated_at: Time.current,
                    status: 'pending')
      end
    end
  end
end
