FactoryBot.define do
  factory :milestone do
    sequence(:account_id) { |n| "user-#{n}" }
    sequence(:name) { |n| "マイルストーン #{n}" }
    status { 'planning' }
    description { nil }
    start_date { nil }
    due_date { nil }
    completed_at { nil }

    # 異なるステータスのマイルストーン
    trait :planning do
      status { 'planning' }
    end

    trait :in_progress do
      status { 'in_progress' }
    end

    trait :completed do
      status { 'completed' }
      completed_at { Time.current }
    end

    trait :cancelled do
      status { 'cancelled' }
    end

    # 説明付き
    trait :with_description do
      description { 'マイルストーンの説明です' }
    end

    # 開始日付付き
    trait :with_start_date do
      start_date { Date.current }
    end

    # 期限付き
    trait :with_due_date do
      due_date { Date.current + 1.month }
    end

    # タスク付き
    trait :with_tasks do
      after(:create) do |milestone|
        create_list(:task, 3, account_id: milestone.account_id).each do |task|
          create(:milestone_task, milestone: milestone, task: task)
        end
      end
    end
  end
end

